from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.auth.dependencies import get_current_user, get_admin_user
from app.database.connection import get_db
from app.utils.mongo import serialize_list

router = APIRouter(prefix="/api/admin", tags=["Admin & Gamification Dashboard"])

@router.get("/analytics", response_model=Dict[str, Any])
async def get_analytics(current_user: dict = Depends(get_admin_user)):
    """Fetch admin KPIs and dashboard performance metrics."""
    db = get_db()
    if db is None:
        return {
            "total_users": 150,
            "active_matches": 42,
            "total_projects": 18,
            "quizzes_completed": 120,
            "trending_skills": ["React", "FastAPI", "UI/UX", "Machine Learning"],
            "total_hours_learned": 320,
            "total_hours_taught": 290
        }

    # Query DB count metrics
    total_users = await db.users.count_documents({})
    active_matches = await db.matches.count_documents({"status": "accepted"})
    total_projects = await db.projects.count_documents({})
    quizzes_completed = await db.quizzes.count_documents({"results.score": {"$exists": True}})

    # Aggregate popular skills
    pipeline = [
        {"$unwind": "$profile.skills_learn"},
        {"$group": {"_id": "$profile.skills_learn", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    cursor = db.users.aggregate(pipeline)
    trending_skills_res = await cursor.to_list(length=5)
    trending_skills = [item["_id"] for item in trending_skills_res if item["_id"]]

    return {
        "total_users": total_users,
        "active_matches": active_matches,
        "total_projects": total_projects,
        "quizzes_completed": quizzes_completed,
        "trending_skills": trending_skills or ["React", "FastAPI", "UI/UX"],
        "total_hours_learned": 450, # Mocked accumulator
        "total_hours_taught": 380   # Mocked accumulator
    }

@router.get("/leaderboard", response_model=Dict[str, Any])
async def get_leaderboard():
    """Retrieve gamified leaderboard rankings for top mentors, learners, and contributors."""
    db = get_db()
    if db is None:
        # Default mock ranks
        mock_ranks = [
            {"username": "priya_ux", "name": "Priya", "score": 4.9, "avatar": "https://api.dicebear.com/7.x/adventurer/svg?seed=Priya"},
            {"username": "dev_react", "name": "Dev", "score": 4.8, "avatar": "https://api.dicebear.com/7.x/adventurer/svg?seed=Dev"}
        ]
        return {
            "top_mentors": mock_ranks,
            "top_learners": mock_ranks,
            "top_contributors": mock_ranks
        }

    # Top Mentors: users sorted by profile rating
    cursor_mentors = db.users.find({"profile.rating": {"$gt": 0}}).sort("profile.rating", -1).limit(10)
    mentors_list = await cursor_mentors.to_list(length=10)
    
    # Top Learners: users with most certificates (mocking score by length of achievements)
    cursor_learners = db.users.find({}).sort("profile.achievements", -1).limit(10)
    learners_list = await cursor_learners.to_list(length=10)

    # Format for response
    top_mentors = [
        {
            "username": u["username"],
            "name": u["profile"]["name"],
            "score": u["profile"]["rating"],
            "avatar": u["profile"]["avatar_url"]
        } for u in mentors_list
    ]

    top_learners = [
        {
            "username": u["username"],
            "name": u["profile"]["name"],
            "score": len(u["profile"].get("achievements", [])),
            "avatar": u["profile"]["avatar_url"]
        } for u in learners_list
    ]

    return {
        "top_mentors": top_mentors,
        "top_learners": top_learners,
        "top_contributors": top_learners # Tie-in
    }
