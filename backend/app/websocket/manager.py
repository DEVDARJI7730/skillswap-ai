from fastapi import WebSocket
from typing import Dict, List, Any
import json
import logging

logger = logging.getLogger("skillswap")

class ConnectionManager:
    def __init__(self):
        # Maps user_id (str) to a list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        """Register a new active WebSocket connection for a user."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected. Active connections count: {len(self.active_connections[user_id])}")

    def disconnect(self, user_id: str, websocket: WebSocket):
        """Remove a closed connection."""
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected.")

    async def send_personal_message(self, message: Dict[str, Any], user_id: str):
        """Send a message to all open connections of a specific user."""
        connections = self.active_connections.get(user_id, [])
        dead_connections = []
        
        for websocket in connections:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                dead_connections.append(websocket)
                
        # Clean up dead connections
        for dead in dead_connections:
            self.disconnect(user_id, dead)

    async def broadcast_to_chat(self, message: Dict[str, Any], participant_ids: List[str]):
        """Broadcast a message to all active participants in a chat room."""
        for pid in participant_ids:
            # Send message if user has an active connection
            await self.send_personal_message(message, str(pid))

    async def broadcast_typing_status(self, sender_id: str, chat_id: str, is_typing: bool, participant_ids: List[str]):
        """Broadcast typing status of user to other participants."""
        typing_payload = {
            "type": "typing",
            "chat_id": chat_id,
            "sender_id": sender_id,
            "is_typing": is_typing
        }
        for pid in participant_ids:
            if str(pid) != sender_id:
                await self.send_personal_message(typing_payload, str(pid))

manager = ConnectionManager()
