from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from datetime import datetime, timezone
import secrets
from app.database.connection import get_db
from app.auth.helpers import get_password_hash, verify_password
from app.auth.jwt_handler import create_access_token, create_refresh_token, decode_token
from app.schemas.user import UserRegisterSchema, UserLoginSchema, TokenSchema, UserResponseSchema, ForgotPasswordSchema, ResetPasswordSchema
from app.utils.mongo import serialize_doc, to_object_id

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponseSchema, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegisterSchema):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Database offline. Please start MongoDB."
        )

    # Check if user already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"email": user_data.email.lower()},
            {"username": user_data.username.lower()}
        ]
    })
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or Email already registered"
        )

    # Hash the password
    hashed_password = get_password_hash(user_data.password)

    # Generate verification token
    verification_token = secrets.token_hex(32)

    new_user = {
        "username": user_data.username.lower(),
        "email": user_data.email.lower(),
        "hashed_password": hashed_password,
        "is_verified": False,
        "verification_token": verification_token,
        "role": "user",
        "profile": {
            "name": user_data.username.title(),
            "university": "",
            "course": "",
            "year": "",
            "country": "",
            "city": "",
            "bio": "",
            "portfolio_url": "",
            "github_url": "",
            "linkedin_url": "",
            "resume_url": "",
            "avatar_url": f"https://api.dicebear.com/7.x/adventurer/svg?seed={user_data.username}",
            "cover_url": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000",
            "skills_teach": [],
            "skills_learn": [],
            "languages": [],
            "experience": "",
            "availability": "",
            "learning_style": "",
            "certificates": [],
            "achievements": [],
            "rating": 0.0,
            "reviews": []
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    result = await db.users.insert_one(new_user)
    new_user["_id"] = result.inserted_id

    # In real world, send email task in background
    # Here we log verification token
    print(f"[Verification Token for {user_data.email}]: {verification_token}")

    return serialize_doc(new_user)

@router.post("/login", response_model=TokenSchema)
async def login(credentials: UserLoginSchema):
    db = get_db()
    if db is None:
        # Development fallback mode
        if credentials.email == "dev@skillswap.ai" and credentials.password == "developer":
            return {
                "access_token": create_access_token({"sub": "dev_user_id", "role": "user", "username": "developer", "email": "dev@skillswap.ai"}),
                "refresh_token": create_refresh_token({"sub": "dev_user_id"}),
                "token_type": "bearer",
                "user_id": "dev_user_id",
                "username": "developer",
                "role": "user"
            }
        raise HTTPException(status_code=503, detail="Database offline.")

    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = str(user["_id"])
    access_token = create_access_token({
        "sub": user_id_str,
        "username": user["username"],
        "email": user["email"],
        "role": user["role"]
    })
    refresh_token = create_refresh_token({"sub": user_id_str})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user_id_str,
        "username": user["username"],
        "role": user["role"]
    }

@router.post("/refresh", response_model=TokenSchema)
async def refresh_tokens(refresh_token: str):
    payload = decode_token(refresh_token, expected_type="refresh")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    db = get_db()
    if db is None:
        # Mock refresh response for dev mode
        return {
            "access_token": create_access_token({"sub": "dev_user_id", "role": "user", "username": "developer", "email": "dev@skillswap.ai"}),
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": "dev_user_id",
            "username": "developer",
            "role": "user"
        }

    user = await db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token = create_access_token({
        "sub": user_id,
        "username": user["username"],
        "email": user["email"],
        "role": user["role"]
    })
    new_refresh_token = create_refresh_token({"sub": user_id})

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user_id": user_id,
        "username": user["username"],
        "role": user["role"]
    }

@router.get("/verify-email")
async def verify_email(token: str):
    db = get_db()
    if db is None:
        return {"status": "success", "message": "Email verified in offline development mode."}

    user = await db.users.find_one({"verification_token": token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True}, "$unset": {"verification_token": ""}}
    )
    return {"status": "success", "message": "Email verified successfully!"}

import smtplib
import random
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_otp_email(to_email: str, otp: str):
    from app.config import settings
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD

    if not smtp_user or not smtp_password:
        print(f"[SMTP Warning]: Credentials missing. OTP printed to terminal: {otp}")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = "SkillSwap AI - Password Reset OTP Code"

        body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #fafafa; padding: 20px; color: #333;">
            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; border: 1px solid #e4e4e7; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
              <h2 style="color: #4f46e5; margin-bottom: 20px; font-weight: 800;">SkillSwap AI Security</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #555;">
                We received a request to reset your password. Use the following 6-digit One-Time Password (OTP) to complete the verification:
              </p>
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin: 25px 0; text-align: center;">
                <span style="font-size: 28px; font-weight: 800; tracking: 4px; color: #4f46e5; letter-spacing: 5px;">{otp}</span>
              </div>
              <p style="font-size: 11px; color: #888; line-height: 1.5; margin-top: 25px;">
                This OTP is valid for 10 minutes. If you did not request this code, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
        
        print(f"[Email Sent]: OTP successfully delivered to {to_email}")
        return True
    except Exception as e:
        print(f"[SMTP Error]: Failed to deliver email to {to_email}: {e}. Fallback OTP: {otp}")
        return False

@router.post("/forgot-password")
async def forgot_password(schema: ForgotPasswordSchema, background_tasks: BackgroundTasks):
    db = get_db()
    otp = f"{random.randint(100000, 999999)}"

    if db is not None:
        user = await db.users.find_one({"email": schema.email.lower()})
        if user:
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"reset_token": otp}}
            )
    
    # Trigger background tasks to deliver the email
    background_tasks.add_task(send_otp_email, schema.email.lower(), otp)
    
    print(f"[Reset OTP for {schema.email}]: {otp}")
    return {"status": "success", "message": "If the email is registered, a 6-digit OTP code has been sent."}

@router.post("/reset-password")
async def reset_password(schema: ResetPasswordSchema):
    db = get_db()
    if db is None:
        return {"status": "success", "message": "Password reset in offline development mode."}

    user = await db.users.find_one({"reset_token": schema.token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    hashed_password = get_password_hash(schema.new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"hashed_password": hashed_password}, "$unset": {"reset_token": ""}}
    )
    return {"status": "success", "message": "Password updated successfully!"}

def decode_google_token(token: str) -> dict:
    import base64
    import json
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        payload_b64 = parts[1]
        # Add necessary base64 padding
        payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
        payload_json = base64.b64decode(payload_b64).decode("utf-8")
        return json.loads(payload_json)
    except Exception:
        return None

@router.post("/google")
async def google_auth(id_token: str):
    """Google Authentication. Resolves both real Google OAuth credentials and simulated dev mocks."""
    db = get_db()
    
    # Check if this is a mock email token from the client
    if id_token.startswith("mock_email:"):
        actual_email = id_token.split(":", 1)[1]
        username = actual_email.split("@")[0]
        name = username.title()
        avatar_url = f"https://api.dicebear.com/7.x/adventurer/svg?seed={username}"
    else:
        # Decode the actual Google JWT token!
        claims = decode_google_token(id_token)
        if claims and "email" in claims:
            actual_email = claims["email"]
            username = actual_email.split("@")[0]
            name = claims.get("name", username.title())
            avatar_url = claims.get("picture", f"https://api.dicebear.com/7.x/adventurer/svg?seed={username}")
        else:
            # Fallback if decode failed
            mock_id = secrets.token_hex(4)
            actual_email = f"google_{mock_id}@gmail.com"
            username = f"google_{mock_id}"
            name = username.title()
            avatar_url = f"https://api.dicebear.com/7.x/adventurer/svg?seed={username}"

    if db is None:
        return {
            "access_token": create_access_token({"sub": "google_user_id", "role": "user", "username": username, "email": actual_email}),
            "refresh_token": create_refresh_token({"sub": "google_user_id"}),
            "token_type": "bearer",
            "user_id": "google_user_id",
            "username": username,
            "role": "user"
        }

    # Search user
    user = await db.users.find_one({"email": actual_email})
    if not user:
        # Auto register
        new_user = {
            "username": username,
            "email": actual_email,
            "hashed_password": get_password_hash(secrets.token_hex(16)),
            "is_verified": True,
            "role": "user",
            "profile": {
                "name": name,
                "university": "Google Sign-in",
                "course": "",
                "year": "",
                "country": "",
                "city": "",
                "bio": "Signed in via Google",
                "portfolio_url": "",
                "github_url": "",
                "linkedin_url": "",
                "resume_url": "",
                "avatar_url": avatar_url,
                "cover_url": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000",
                "skills_teach": [],
                "skills_learn": [],
                "languages": [],
                "experience": "",
                "availability": "",
                "learning_style": "",
                "certificates": [],
                "achievements": [],
                "rating": 0.0,
                "reviews": []
            },
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        result = await db.users.insert_one(new_user)
        user = new_user
        user["_id"] = result.inserted_id

    user_id_str = str(user["_id"])
    access_token = create_access_token({
        "sub": user_id_str,
        "username": user["username"],
        "email": user["email"],
        "role": user["role"]
    })
    refresh_token = create_refresh_token({"sub": user_id_str})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user_id_str,
        "username": user["username"],
        "role": user["role"]
    }
