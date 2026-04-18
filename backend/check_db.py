import asyncio
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.getcwd())
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.transaction import Transaction

async def check():
    client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
    db = client[os.getenv("DB_NAME", "bankDb")]
    await init_beanie(database=db, document_models=[Transaction])
    
    # Check for anything that looks manual in the bank column
    txns = await Transaction.find(
        (Transaction.bank == "Cash/Manual") | 
        (Transaction.bank == "Manual") | 
        (Transaction.bank == "jangar") |
        (Transaction.bank == "Manually Added")
    ).to_list()
    
    print(f"Found {len(txns)} potentially manual transactions in Transaction collection.")
    for t in txns:
        print(f"ID: {t.id} | Date: {t.date} | Bank: {t.bank} | Payee: {t.payee} | Desc: {t.description}")

if __name__ == "__main__":
    asyncio.run(check())
