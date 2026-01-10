import asyncio
import os
from dotenv import load_dotenv
from app.models.transaction import Transaction
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "bank_app_db")

async def check_payees():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    await init_beanie(database=db, document_models=[Transaction])
    
    print("--- RAW PAYEE vs DESCRIPTION (Top 5) ---")
    with open("payee_sample.txt", "w", encoding="utf-8") as f:
        # Fetch 20 transactions
        cursor = Transaction.find({"payee": {"$regex": "^UPI"}}).limit(20)
        async for txn in cursor:
            f.write(f"Desc: '{txn.description}'\n")
            f.write(f"Payee: '{txn.payee}'\n\n")

if __name__ == "__main__":
    asyncio.run(check_payees())
