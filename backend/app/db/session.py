import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.transaction import Transaction
from app.models.budget import BudgetEntry

import logging

logger = logging.getLogger(__name__)

async def init_db():
    try:
        logger.info("🔌 Connecting to MongoDB...")
        client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
        db = client[os.getenv("DB_NAME")]
        await init_beanie(database=db, document_models=[Transaction, BudgetEntry])
        logger.info("✅ MongoDB & Beanie Initialized Successfully")
    except Exception as e:
        logger.critical(f"🔥 DATABASE CONNECTION FAILED: {e}", exc_info=True)
