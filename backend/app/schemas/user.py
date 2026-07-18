from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class CertificateSchema(BaseModel):
    title: str
    issuer: str
    date: Optional[str] = None
    credential_url: Optional[str] = None

class ReviewSchema(BaseModel):
    reviewer_id: str
    reviewer_name: str
    rating: float
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfileSchema(BaseModel):
    name: str = ""
    university: str = ""
    course: str = ""
    year: str = ""
    country: str = ""
    city: str = ""
    bio: str = ""
    portfolio_url: str = ""
    github_url: str = ""
    linkedin_url: str = ""
    resume_url: str = ""
    avatar_url: str = "https://api.dicebear.com/7.x/adventurer/svg?seed=SkillSwap"
    cover_url: str = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000"
    skills_teach: List[str] = []
    skills_learn: List[str] = []
    languages: List[str] = []
    experience: str = ""
    availability: str = ""
    learning_style: str = ""
    certificates: List[CertificateSchema] = []
    achievements: List[str] = []
    rating: float = 0.0
    reviews: List[ReviewSchema] = []

class UserRegisterSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    role: str

class ForgotPasswordSchema(BaseModel):
    email: EmailStr

class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

class UserResponseSchema(BaseModel):
    id: str
    username: str
    email: EmailStr
    is_verified: bool
    role: str
    profile: UserProfileSchema
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
