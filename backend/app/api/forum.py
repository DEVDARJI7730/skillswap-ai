from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import secrets
from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.utils.mongo import serialize_doc, serialize_list, to_object_id

router = APIRouter(prefix="/api/forum", tags=["Discussion Forum"])

class PostCreateRequest(BaseModel):
    title: str
    content: str
    tags: List[str] = []

class AnswerCreateRequest(BaseModel):
    content: str

@router.post("/ask")
async def ask_question(req: PostCreateRequest, current_user: dict = Depends(get_current_user)):
    """Publish a new question thread in the community forum."""
    db = get_db()
    
    new_post = {
        "title": req.title,
        "content": req.content,
        "author_id": to_object_id(current_user["id"]) if db is not None else "dev_user_id",
        "tags": req.tags,
        "votes": [], # List of User ObjectIds who upvoted
        "answers": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    if db is not None:
        result = await db.forum.insert_one(new_post)
        new_post["_id"] = result.inserted_id
        
    return serialize_doc(new_post)

@router.get("/list", response_model=List[dict])
async def list_posts(tag: Optional[str] = Query(None), q: Optional[str] = Query(None)):
    """List forum posts with optional tag and text search."""
    db = get_db()
    if db is None:
        return [
            {
                "id": "mock_post_id",
                "title": "How to handle JWT token expiration in Next.js?",
                "content": "I am struggling with handling access tokens refresh on frontend.",
                "author_id": "dev_user_id",
                "tags": ["nextjs", "jwt", "auth"],
                "votes": ["dev_user_id"],
                "answers": [],
                "created_at": datetime.now(timezone.utc)
            }
        ]

    query = {}
    if tag:
        query["tags"] = {"$regex": tag, "$options": "i"}
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"content": {"$regex": q, "$options": "i"}}
        ]
        
    cursor = db.forum.find(query).sort("created_at", -1).limit(50)
    posts = await cursor.to_list(length=50)
    
    # Hydrate author username
    hydrated_posts = []
    for post in posts:
        post_doc = serialize_doc(post)
        author = await db.users.find_one({"_id": post["author_id"]}, {"username": 1, "profile.name": 1, "profile.avatar_url": 1})
        if author:
            post_doc["author"] = serialize_doc(author)
        hydrated_posts.append(post_doc)
        
    return hydrated_posts

@router.get("/{post_id}", response_model=dict)
async def get_post_details(post_id: str):
    """Retrieve full detail of a forum thread including answers and upvotes."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    post = await db.forum.find_one({"_id": to_object_id(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Forum thread not found")

    hydrated_post = serialize_doc(post)
    
    # Hydrate main author
    author = await db.users.find_one({"_id": post["author_id"]}, {"username": 1, "profile.name": 1, "profile.avatar_url": 1})
    if author:
        hydrated_post["author"] = serialize_doc(author)

    # Hydrate answers authors
    answers = post.get("answers", [])
    hydrated_answers = []
    for ans in answers:
        ans_doc = ans.copy()
        ans_author = await db.users.find_one({"_id": to_object_id(ans["author_id"])}, {"username": 1, "profile.name": 1, "profile.avatar_url": 1})
        if ans_author:
            ans_doc["author"] = serialize_doc(ans_author)
        hydrated_answers.append(ans_doc)
        
    hydrated_post["answers"] = hydrated_answers
    return hydrated_post

@router.post("/{post_id}/answer")
async def answer_question(post_id: str, req: AnswerCreateRequest, current_user: dict = Depends(get_current_user)):
    """Post an answer or response to a specific question thread."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    post_obj_id = to_object_id(post_id)
    post = await db.forum.find_one({"_id": post_obj_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    answer_id = secrets.token_hex(4)
    new_answer = {
        "id": answer_id,
        "author_id": to_object_id(current_user["id"]),
        "content": req.content,
        "votes": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.forum.update_one(
        {"_id": post_obj_id},
        {"$push": {"answers": new_answer}}
    )
    
    # Award achievement badge for active community participation
    user_id = to_object_id(current_user["id"])
    achievements = current_user.get("profile", {}).get("achievements", [])
    if "Community Hero" not in achievements:
        achievements.append("Community Hero")
        await db.users.update_one({"_id": user_id}, {"$set": {"profile.achievements": achievements}})

    return {"status": "success", "answer_id": answer_id, "answer": new_answer}

@router.post("/{post_id}/vote")
async def vote_post(post_id: str, current_user: dict = Depends(get_current_user)):
    """Toggle upvote/downvote for a discussion thread."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    post_obj_id = to_object_id(post_id)
    post = await db.forum.find_one({"_id": post_obj_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    votes = post.get("votes", [])
    user_obj_id = to_object_id(current_user["id"])

    if user_obj_id in votes:
        # Downvote / remove upvote
        votes.remove(user_obj_id)
        action = "removed"
    else:
        # Upvote
        votes.append(user_obj_id)
        action = "upvoted"

    await db.forum.update_one(
        {"_id": post_obj_id},
        {"$set": {"votes": votes}}
    )

    return {"status": "success", "action": action, "total_votes": len(votes)}
