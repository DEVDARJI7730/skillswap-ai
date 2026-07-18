from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timezone
from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.schemas.user import UserProfileSchema, UserResponseSchema
from app.utils.mongo import serialize_doc, serialize_list, to_object_id

router = APIRouter(prefix="/api/users", tags=["Users & Profiles"])

@router.get("/me", response_model=UserResponseSchema)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return current_user

@router.put("/profile", response_model=UserResponseSchema)
async def update_profile(profile_data: UserProfileSchema, current_user: dict = Depends(get_current_user)):
    """Update user's profile details."""
    db = get_db()
    if db is None:
        # Development fallback
        current_user["profile"] = profile_data.dict()
        return current_user

    # Prepare profile data for updating
    updated_profile = profile_data.dict()
    # Keep rating and reviews unless empty to avoid overwriting scores
    if not updated_profile.get("reviews"):
        updated_profile["reviews"] = current_user["profile"].get("reviews", [])
    if updated_profile.get("rating") == 0.0:
        updated_profile["rating"] = current_user["profile"].get("rating", 0.0)

    # Perform DB update
    user_id = to_object_id(current_user["id"])
    await db.users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "profile": updated_profile,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    updated_user = await db.users.find_one({"_id": user_id})
    return serialize_doc(updated_user)

@router.get("/profile/{username}", response_model=UserResponseSchema)
async def get_public_profile(username: str):
    """Retrieve public portfolio details by username."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline.")

    user = await db.users.find_one({"username": username.lower()})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return serialize_doc(user)

@router.post("/resume-upload")
async def upload_resume(resume_url: str, current_user: dict = Depends(get_current_user)):
    """Upload resume URL link. Cloudinary integrations hook into this."""
    db = get_db()
    user_id = to_object_id(current_user["id"])
    
    if db is not None:
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"profile.resume_url": resume_url, "updated_at": datetime.now(timezone.utc)}}
        )
    return {"status": "success", "resume_url": resume_url}

@router.get("/search", response_model=List[UserResponseSchema])
async def search_users(
    skill: Optional[str] = Query(None, description="Filter by skill teach/learn"),
    college: Optional[str] = Query(None, description="Filter by college / university name"),
    country: Optional[str] = Query(None, description="Filter by country"),
    language: Optional[str] = Query(None, description="Filter by language"),
    experience: Optional[str] = Query(None, description="Filter by experience level"),
    min_rating: Optional[float] = Query(None, description="Filter by minimum rating"),
    availability: Optional[str] = Query(None, description="Filter by availability")
):
    """Advanced Search for users based on multiple parameters."""
    db = get_db()
    if db is None:
        return []

    query = {}

    if skill:
        # Check if the user teaches or wants to learn this skill
        query["$or"] = [
            {"profile.skills_teach": {"$regex": skill, "$options": "i"}},
            {"profile.skills_learn": {"$regex": skill, "$options": "i"}}
        ]
    
    if college:
        query["profile.university"] = {"$regex": college, "$options": "i"}
        
    if country:
        query["profile.country"] = {"$regex": country, "$options": "i"}
        
    if language:
        query["profile.languages"] = {"$regex": language, "$options": "i"}
        
    if experience:
        query["profile.experience"] = {"$regex": experience, "$options": "i"}
        
    if min_rating is not None:
        query["profile.rating"] = {"$gte": min_rating}
        
    if availability:
        query["profile.availability"] = {"$regex": availability, "$options": "i"}

    # Execute search
    cursor = db.users.find(query).limit(50)
    results = await cursor.to_list(length=50)
    return serialize_list(results)