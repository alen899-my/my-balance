import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.transaction import Transaction
from beanie import init_beanie
import re

async def check_tx():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(database=client.bank_app, document_models=[Transaction])
    
    entries = await Transaction.find({"description": {"$regex": "GYM", "$options": "i"}}).to_list()
    print(f"Transactions containing 'GYM': {len(entries)}")
    for e in entries[:10]:
        print(f"Desc: {e.description}, Payee: {e.payee}, Amt: {e.debit or e.credit}, Date: {e.date}")

if __name__ == "__main__":
    asyncio.run(check_tx())
