from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timezone
from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.ai.gemini_service import GeminiService
from app.utils.mongo import serialize_doc, serialize_list, to_object_id

router = APIRouter(prefix="/api/matches", tags=["AI Matching Engine"])

@router.get("/recommendations", response_model=List[dict])
async def get_match_recommendations(current_user: dict = Depends(get_current_user)):
    """Recommend compatible users based on skills taught vs skills wanted."""
    db = get_db()
    if db is None:
        return []

    user_skills_learn = current_user.get("profile", {}).get("skills_learn", [])
    user_skills_teach = current_user.get("profile", {}).get("skills_teach", [])
    
    # Simple recommendation algorithm:
    # 1. Match users who teach what I want to learn.
    # 2. Match users who want to learn what I teach.
    query = {
        "_id": {"$ne": to_object_id(current_user["id"])},
        "$or": [
            {"profile.skills_teach": {"$in": user_skills_learn}},
            {"profile.skills_learn": {"$in": user_skills_teach}}
        ]
    }
    
    cursor = db.users.find(query).limit(10)
    users = await cursor.to_list(length=10)
    
    # Calculate a simple match compatibility mockup for the lists
    recommendations = []
    for user in users:
        serialized_user = serialize_doc(user)
        # Calculate overlapping skills count
        teach_overlap = len(set(serialized_user["profile"]["skills_teach"]) & set(user_skills_learn))
        learn_overlap = len(set(serialized_user["profile"]["skills_learn"]) & set(user_skills_teach))
        
        score = 50 + (teach_overlap + learn_overlap) * 15
        score = min(score, 98)
        
        serialized_user["compatibility_score"] = score
        recommendations.append(serialized_user)
        
    # Sort recommendations by compatibility
    recommendations.sort(key=lambda x: x["compatibility_score"], reverse=True)
    return recommendations

@router.post("/request/{target_user_id}")
async def request_match(target_user_id: str, current_user: dict = Depends(get_current_user)):
    """Request a skill swap with another user."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    target_obj_id = to_object_id(target_user_id)
    if not target_obj_id:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    if target_user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="You cannot request a match with yourself")

    target_user = await db.users.find_one({"_id": target_obj_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Check if request already exists
    existing = await db.matches.find_one({
        "$or": [
            {"user_1_id": to_object_id(current_user["id"]), "user_2_id": target_obj_id},
            {"user_1_id": target_obj_id, "user_2_id": to_object_id(current_user["id"])}
        ]
    })
    if existing:
        return {"status": "already_exists", "match_id": str(existing["_id"]), "match_status": existing["status"]}

    new_match = {
        "user_1_id": to_object_id(current_user["id"]),
        "user_2_id": target_obj_id,
        "status": "pending",
        "compatibility_score": 0,
        "matching_details": {},
        "created_at": datetime.now(timezone.utc)
    }

    result = await db.matches.insert_one(new_match)
    return {"status": "success", "match_id": str(result.inserted_id), "match_status": "pending"}

@router.post("/respond/{match_id}/{action}")
async def respond_match(match_id: str, action: str, current_user: dict = Depends(get_current_user)):
    """Accept or reject a pending match request. Computes compatibility report on accept."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    if action not in ["accept", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'accept' or 'reject'")

    match_obj_id = to_object_id(match_id)
    match = await db.matches.find_one({"_id": match_obj_id})
    if not match:
        raise HTTPException(status_code=404, detail="Match request not found")

    # Ensure current user is the target receiver of the match request (user_2)
    if str(match["user_2_id"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this request")

    if match["status"] != "pending":
        return {"status": "already_processed", "match_status": match["status"]}

    if action == "reject":
        await db.matches.update_one({"_id": match_obj_id}, {"$set": {"status": "rejected"}})
        return {"status": "success", "match_status": "rejected"}

    # Action is 'accept'
    # Fetch details for both users to trigger AI matching engine
    user_1 = await db.users.find_one({"_id": match["user_1_id"]})
    
    # Run the Gemini matching engine
    ai_report = await GeminiService.match_profiles(user_1, current_user)

    await db.matches.update_one(
        {"_id": match_obj_id},
        {
            "$set": {
                "status": "accepted",
                "compatibility_score": ai_report["compatibility_score"],
                "matching_details": ai_report
            }
        }
    )

    # Automatically create a default chat room for them
    chat_exists = await db.chats.find_one({
        "participants": {"$all": [match["user_1_id"], match["user_2_id"]]}
    })
    if not chat_exists:
        await db.chats.insert_one({
            "participants": [match["user_1_id"], match["user_2_id"]],
            "messages": [],
            "updated_at": datetime.now(timezone.utc)
        })

    return {"status": "success", "match_status": "accepted", "report": ai_report}

@router.get("/list", response_model=List[dict])
async def list_matches(current_user: dict = Depends(get_current_user)):
    """List all active/pending matches for the user."""
    db = get_db()
    if db is None:
        return []

    user_id = to_object_id(current_user["id"])
    cursor = db.matches.find({
        "$or": [
            {"user_1_id": user_id},
            {"user_2_id": user_id}
        ]
    })
    matches = await cursor.to_list(length=100)
    
    # Hydrate target user details
    hydrated_matches = []
    for m in matches:
        m_doc = serialize_doc(m)
        target_id = m["user_2_id"] if str(m["user_1_id"]) == current_user["id"] else m["user_1_id"]
        target_user = await db.users.find_one({"_id": target_id})
        if target_user:
            m_doc["target_user"] = serialize_doc(target_user)
        hydrated_matches.append(m_doc)
        
    return hydrated_matches
