from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import logging
from datetime import datetime, timezone
import secrets
from app.websocket.manager import manager
from app.database.connection import get_db
from app.utils.mongo import to_object_id

logger = logging.getLogger("skillswap")
router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket connection hub for real-time messaging, typing events, and read receipts."""
    await manager.connect(user_id, websocket)
    db = get_db()
    
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            event_type = payload.get("type")
            chat_id = payload.get("chat_id")
            
            if not chat_id or not db:
                continue
                
            chat_obj_id = to_object_id(chat_id)
            chat = await db.chats.find_one({"_id": chat_obj_id})
            if not chat:
                continue
                
            participants = [str(pid) for pid in chat.get("participants", [])]
            if user_id not in participants:
                continue

            if event_type == "message":
                msg_text = payload.get("text", "")
                media_url = payload.get("media_url", "")
                media_type = payload.get("media_type", "") # image, file, voice, meeting
                
                message_id = secrets.token_hex(8)
                new_msg = {
                    "id": message_id,
                    "sender_id": user_id,
                    "text": msg_text,
                    "media_url": media_url,
                    "media_type": media_type,
                    "seen": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "edited": False,
                    "deleted": False
                }
                
                # Update DB
                await db.chats.update_one(
                    {"_id": chat_obj_id},
                    {
                        "$push": {"messages": new_msg},
                        "$set": {"updated_at": datetime.now(timezone.utc)}
                    }
                )
                
                # Broadcast
                broadcast_payload = {
                    "type": "message",
                    "chat_id": chat_id,
                    "message": new_msg
                }
                await manager.broadcast_to_chat(broadcast_payload, participants)

            elif event_type == "typing":
                is_typing = payload.get("is_typing", False)
                await manager.broadcast_typing_status(user_id, chat_id, is_typing, participants)

            elif event_type == "seen":
                messages = chat.get("messages", [])
                updated = False
                for msg in messages:
                    if msg.get("sender_id") != user_id and not msg.get("seen"):
                        msg["seen"] = True
                        updated = True
                
                if updated:
                    await db.chats.update_one(
                        {"_id": chat_obj_id},
                        {"$set": {"messages": messages}}
                    )
                    seen_payload = {
                        "type": "seen",
                        "chat_id": chat_id,
                        "viewer_id": user_id
                    }
                    await manager.broadcast_to_chat(seen_payload, participants)

            elif event_type == "edit":
                msg_id = payload.get("message_id")
                new_text = payload.get("text", "")
                
                messages = chat.get("messages", [])
                updated = False
                for msg in messages:
                    if msg.get("id") == msg_id and msg.get("sender_id") == user_id:
                        msg["text"] = new_text
                        msg["edited"] = True
                        updated = True
                        break
                        
                if updated:
                    await db.chats.update_one(
                        {"_id": chat_obj_id},
                        {"$set": {"messages": messages}}
                    )
                    edit_payload = {
                        "type": "edit",
                        "chat_id": chat_id,
                        "message_id": msg_id,
                        "text": new_text
                    }
                    await manager.broadcast_to_chat(edit_payload, participants)

            elif event_type == "delete":
                msg_id = payload.get("message_id")
                
                messages = chat.get("messages", [])
                updated = False
                for msg in messages:
                    if msg.get("id") == msg_id and msg.get("sender_id") == user_id:
                        msg["text"] = "This message was deleted."
                        msg["deleted"] = True
                        updated = True
                        break
                        
                if updated:
                    await db.chats.update_one(
                        {"_id": chat_obj_id},
                        {"$set": {"messages": messages}}
                    )
                    delete_payload = {
                        "type": "delete",
                        "chat_id": chat_id,
                        "message_id": msg_id
                    }
                    await manager.broadcast_to_chat(delete_payload, participants)

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket execution error on user {user_id}: {e}")
        manager.disconnect(user_id, websocket)
