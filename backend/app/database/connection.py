import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("skillswap")

class Database:
    client: AsyncIOMotorClient = None
    db = None

    async def connect_db(self):
        """Connect to MongoDB with a short timeout to prevent startup blocking if DB is offline."""
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
            # Set serverSelectionTimeoutMS to 2 seconds so startup won't hang if database is offline
            self.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
            self.db = self.client[settings.DB_NAME]
            # Simple ping to verify connection
            await self.client.admin.command('ping')
            logger.info("Successfully connected to MongoDB!")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            logger.warning("Backend will run in offline development mode (database queries will mock or fail).")

    async def close_db(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

db_manager = Database()

def get_db():
    return db_manager.db
