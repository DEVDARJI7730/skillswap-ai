from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, timezone
from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.ai.gemini_service import GeminiService
from app.utils.mongo import serialize_doc, serialize_list, to_object_id

router = APIRouter(prefix="/api/quizzes", tags=["AI Quiz Generator"])

class QuizRequest(BaseModel):
    topic: str
    difficulty: str = "Medium"

class QuizSubmitRequest(BaseModel):
    answers: Dict[str, str]  # dict mapping question id (str) to selected answer (str)

@router.post("/generate")
async def generate_quiz(req: QuizRequest, current_user: dict = Depends(get_current_user)):
    """Generate an AI assessment quiz on a specific topic."""
    db = get_db()
    
    quiz_data = await GeminiService.generate_quiz(req.topic, req.difficulty)
    quiz_data["user_id"] = to_object_id(current_user["id"]) if db is not None else "dev_user_id"
    quiz_data["created_at"] = datetime.now(timezone.utc)
    quiz_data["results"] = {}
    
    if db is not None:
        result = await db.quizzes.insert_one(quiz_data)
        quiz_data["_id"] = result.inserted_id
        
    return serialize_doc(quiz_data)

@router.post("/submit/{quiz_id}")
async def submit_quiz(quiz_id: str, submission: QuizSubmitRequest, current_user: dict = Depends(get_current_user)):
    """Grade quiz responses, issue certification badges and record feedback."""
    db = get_db()
    if db is None:
        # Development fallback
        return {
            "score": 80,
            "feedback": "Great effort! You've achieved a certification badge in local mock mode.",
            "weak_areas": ["Basic configuration"],
            "suggested_next_steps": ["Try intermediate tests next."],
            "certificate_issued": True
        }

    quiz_obj_id = to_object_id(quiz_id)
    quiz = await db.quizzes.find_one({"_id": quiz_obj_id})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Call grading service
    results = await GeminiService.grade_quiz(quiz, submission.answers)
    results["completed_at"] = datetime.now(timezone.utc)

    # Save results to DB
    await db.quizzes.update_one(
        {"_id": quiz_obj_id},
        {"$set": {"results": results}}
    )

    # If certificate issued, award badge to user achievements list
    if results.get("certificate_issued"):
        user_id = to_object_id(current_user["id"])
        badge_name = f"{quiz['topic'].title()} Master ({quiz['difficulty']})"
        
        # Pull profile achievements list and append if not existing
        achievements = current_user.get("profile", {}).get("achievements", [])
        if badge_name not in achievements:
            achievements.append(badge_name)
            await db.users.update_one(
                {"_id": user_id},
                {"$set": {"profile.achievements": achievements}}
            )

    return results

@router.get("/list", response_model=List[dict])
async def list_quizzes(current_user: dict = Depends(get_current_user)):
    """Retrieve history of all quizzes taken by user."""
    db = get_db()
    if db is None:
        return []

    cursor = db.quizzes.find({"user_id": to_object_id(current_user["id"])})
    quizzes = await cursor.to_list(length=100)
    return serialize_list(quizzes)
