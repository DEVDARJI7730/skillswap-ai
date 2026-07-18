from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth.jwt_handler import decode_token
from app.database.connection import get_db
from app.utils.mongo import to_object_id, serialize_doc

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to retrieve and validate the current authenticated user."""
    token = credentials.credentials
    payload = decode_token(token, expected_type="access")
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid: missing user identifier",
        )
        
    db = get_db()
    if db is None:
        # Mock user if database connection is not active (offline mode fallback)
        return {
            "id": user_id,
            "username": payload.get("username", "developer"),
            "email": payload.get("email", "dev@skillswap.ai"),
            "role": payload.get("role", "user"),
            "is_verified": True,
            "profile": {
                "name": "Dev User",
                "skills_teach": ["React", "Python"],
                "skills_learn": ["UI/UX"]
            }
        }

    user_obj_id = to_object_id(user_id)
    user = await db.users.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
        
    return serialize_doc(user)

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Dependency to enforce admin role access."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: admin privileges required",
        )
    return current_user
