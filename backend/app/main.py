from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager

from app.config import settings
from app.database.connection import db_manager

# Import modular API routes
from app.auth.routes import router as auth_router
from app.api.users import router as users_router
from app.api.matches import router as matches_router
from app.api.roadmaps import router as roadmaps_router
from app.api.quizzes import router as quizzes_router
from app.api.chats import router as chats_router
from app.api.projects import router as projects_router
from app.api.forum import router as forum_router
from app.api.admin import router as admin_router
from app.websocket.routes import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events managing database pool connection."""
    # Connect database
    await db_manager.connect_db()
    yield
    # Disconnect database
    await db_manager.close_db()

app = FastAPI(
    title="SkillSwap AI API",
    description="Scalable backend with AI Matching Engine, learning roadmaps, assessment quizzes, real-time WebSockets, and project collaboration.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Bind modular routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(matches_router)
app.include_router(roadmaps_router)
app.include_router(quizzes_router)
app.include_router(chats_router)
app.include_router(projects_router)
app.include_router(forum_router)
app.include_router(admin_router)
app.include_router(ws_router)

@app.get("/health")
async def health_check():
    """Service health state check."""
    return {"status": "healthy", "service": "SkillSwap AI Backend"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
