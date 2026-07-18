from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import secrets
from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.utils.mongo import serialize_doc, serialize_list, to_object_id

router = APIRouter(prefix="/api/projects", tags=["Project Collaboration"])

class ProjectCreateRequest(BaseModel):
    title: str
    description: str

class TaskCreateRequest(BaseModel):
    title: str
    description: str
    assigned_to: Optional[str] = None
    deadline: Optional[str] = None

class TaskUpdateRequest(BaseModel):
    status: str # pending, in_progress, completed

@router.post("/create")
async def create_project(req: ProjectCreateRequest, current_user: dict = Depends(get_current_user)):
    """Create a collaborative learning project workspace."""
    db = get_db()
    
    new_project = {
        "title": req.title,
        "description": req.description,
        "creator_id": to_object_id(current_user["id"]) if db is not None else "dev_user_id",
        "members": [to_object_id(current_user["id"])] if db is not None else ["dev_user_id"],
        "tasks": [],
        "files": [],
        "progress": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    if db is not None:
        result = await db.projects.insert_one(new_project)
        new_project["_id"] = result.inserted_id
        
    return serialize_doc(new_project)

@router.get("/list", response_model=List[dict])
async def list_projects(current_user: dict = Depends(get_current_user)):
    """List all projects that the current user is a member of."""
    db = get_db()
    if db is None:
        return [
            {
                "id": "mock_proj_id",
                "title": "SkillSwap AI Platform",
                "description": "Collaborative project to build SkillSwap.",
                "creator_id": "dev_user_id",
                "members": ["dev_user_id"],
                "tasks": [
                    {"id": "task1", "title": "Design Figma Mockups", "assigned_to": "dev_user_id", "deadline": "2026-08-01", "status": "in_progress"}
                ],
                "files": [],
                "progress": 25,
                "created_at": datetime.now(timezone.utc)
            }
        ]

    user_id = to_object_id(current_user["id"])
    cursor = db.projects.find({"members": user_id})
    projects = await cursor.to_list(length=100)
    return serialize_list(projects)

@router.get("/{project_id}", response_model=dict)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """Get project details."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    project = await db.projects.find_one({"_id": to_object_id(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if to_object_id(current_user["id"]) not in project["members"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this project")

    # Hydrate member names
    hydrated_proj = serialize_doc(project)
    hydrated_members = []
    for member_id in project["members"]:
        member = await db.users.find_one({"_id": member_id}, {"username": 1, "profile.name": 1, "profile.avatar_url": 1})
        if member:
            hydrated_members.append(serialize_doc(member))
    hydrated_proj["members_details"] = hydrated_members

    return hydrated_proj

@router.post("/{project_id}/join")
async def join_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """Join an open project workspace."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    proj_obj_id = to_object_id(project_id)
    project = await db.projects.find_one({"_id": proj_obj_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    user_id = to_object_id(current_user["id"])
    if user_id in project["members"]:
        return {"status": "already_member"}

    await db.projects.update_one(
        {"_id": proj_obj_id},
        {"$push": {"members": user_id}}
    )
    return {"status": "success", "message": "Joined project successfully!"}

@router.post("/{project_id}/tasks")
async def create_task(project_id: str, req: TaskCreateRequest, current_user: dict = Depends(get_current_user)):
    """Create a new task under a collaborative project."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    proj_obj_id = to_object_id(project_id)
    project = await db.projects.find_one({"_id": proj_obj_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if to_object_id(current_user["id"]) not in project["members"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    task_id = secrets.token_hex(4)
    new_task = {
        "id": task_id,
        "title": req.title,
        "description": req.description,
        "assigned_to": req.assigned_to,
        "deadline": req.deadline,
        "status": "pending"
    }

    await db.projects.update_one(
        {"_id": proj_obj_id},
        {"$push": {"tasks": new_task}}
    )
    return {"status": "success", "task_id": task_id, "task": new_task}

@router.put("/{project_id}/tasks/{task_id}")
async def update_task(project_id: str, task_id: str, req: TaskUpdateRequest, current_user: dict = Depends(get_current_user)):
    """Update task status and recalculate progress."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    proj_obj_id = to_object_id(project_id)
    project = await db.projects.find_one({"_id": proj_obj_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if to_object_id(current_user["id"]) not in project["members"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    tasks = project.get("tasks", [])
    updated = False
    completed_count = 0
    
    for task in tasks:
        if task["id"] == task_id:
            task["status"] = req.status
            updated = True
        if task["status"] == "completed":
            completed_count += 1

    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")

    progress = int((completed_count / len(tasks)) * 100) if tasks else 0

    await db.projects.update_one(
        {"_id": proj_obj_id},
        {"$set": {"tasks": tasks, "progress": progress}}
    )

    return {"status": "success", "progress": progress, "tasks": tasks}
