from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import secrets
from app.auth.dependencies import get_current_user
from app.database.connection import get_db
from app.utils.mongo import serialize_doc, serialize_list, to_object_id

router = APIRouter(prefix="/api/chats", tags=["Real-time Chat"])

class MeetingRequest(BaseModel):
    chat_id: str

@router.get("/list", response_model=List[dict])
async def list_chats(current_user: dict = Depends(get_current_user)):
    """List all chat conversations for the current user."""
    db = get_db()
    if db is None:
        return []

    user_id = to_object_id(current_user["id"])
    cursor = db.chats.find({"participants": user_id})
    chats = await cursor.to_list(length=100)

    hydrated_chats = []
    for c in chats:
        c_doc = serialize_doc(c)
        # Find the other participant
        other_id = [p for p in c["participants"] if str(p) != current_user["id"]]
        if other_id:
            other_user = await db.users.find_one({"_id": other_id[0]})
            if other_user:
                c_doc["recipient"] = serialize_doc(other_user)
        hydrated_chats.append(c_doc)
        
    return hydrated_chats

@router.get("/{chat_id}/messages", response_model=List[dict])
async def get_messages(chat_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve all messages in a specific conversation."""
    db = get_db()
    if db is None:
        return []

    chat = await db.chats.find_one({"_id": to_object_id(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Verify user is participant
    if to_object_id(current_user["id"]) not in chat["participants"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")

    messages = chat.get("messages", [])
    # Mark messages from the other user as seen
    updated = False
    for msg in messages:
        if str(msg.get("sender_id")) != current_user["id"] and not msg.get("seen"):
            msg["seen"] = True
            updated = True

    if updated:
        await db.chats.update_one(
            {"_id": to_object_id(chat_id)},
            {"$set": {"messages": messages}}
        )

    return messages

@router.post("/meeting")
async def create_meeting(req: MeetingRequest, current_user: dict = Depends(get_current_user)):
    """Generate Jitsi Meet room credentials and details."""
    db = get_db()
    chat_obj_id = to_object_id(req.chat_id)
    
    if db is not None:
        chat = await db.chats.find_one({"_id": chat_obj_id})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        if to_object_id(current_user["id"]) not in chat["participants"]:
            raise HTTPException(status_code=403, detail="Not authorized")

    room_name = f"skillswap-{req.chat_id}-{secrets.token_hex(4)}"
    jitsi_link = f"https://meet.jit.si/{room_name}"
    
    # Store meeting details inside chat history as a system message
    meeting_msg = {
        "id": secrets.token_hex(8),
        "sender_id": "system",
        "text": f"Meeting room created: Joined by {current_user['profile']['name']}",
        "media_url": jitsi_link,
        "media_type": "meeting",
        "seen": False,
        "created_at": datetime.now(timezone.utc)
    }

    if db is not None:
        await db.chats.update_one(
            {"_id": chat_obj_id},
            {
                "$push": {"messages": meeting_msg},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
    return {"status": "success", "jitsi_link": jitsi_link, "room_name": room_name}
