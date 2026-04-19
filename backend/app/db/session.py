import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.transaction import Transaction
from app.models.budget import BudgetEntry
from app.models.job import JobStatus
from app.models.daily_budget import DailyBudgetEntry
from app.models.goal import Goal
from app.models.calendar import CalendarNeed
from app.models.wallet import WalletTransaction
from app.models.lendborrow import LendBorrowEntry
from app.models.metals import MetalAsset
import logging

logger = logging.getLogger(__name__)

async def init_db():
    try:
        logger.info("🔌 Connecting to MongoDB...")
        client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
        db = client[os.getenv("DB_NAME")]
        await init_beanie(database=db, document_models=[Transaction, BudgetEntry, JobStatus, DailyBudgetEntry, Goal, CalendarNeed, WalletTransaction, LendBorrowEntry, MetalAsset])
        logger.info("✅ MongoDB & Beanie Initialized Successfully")
    except Exception as e:
        logger.critical(f"🔥 DATABASE CONNECTION FAILED: {e}", exc_info=True)
