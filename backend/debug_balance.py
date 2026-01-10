import asyncio
import os
from dotenv import load_dotenv
from app.models.transaction import Transaction
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "bank_app_db")

async def check_balance_logic():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    await init_beanie(database=db, document_models=[Transaction])
    
    # 1. Fetch Top 10 by Date DESC, _id DESC (The "LATEST" according to our logic)
    print("\n--- SORT: DATE DESC, _ID DESC (Latest First) ---")
    
    cursor = Transaction.find({}).sort([("date", -1), ("_id", -1)]).limit(10)
    txns = await cursor.to_list()
    
    # Print in REVERSE order (Oldest -> Newest of this batch) to check balance math
    for i in range(len(txns)-1, -1, -1):
        t = txns[i]
        print(f"ID: {t.id} | Date: {t.date_str} | Desc: {t.description[:20]}... | Cr: {t.credit} | Dr: {t.debit} | Bal: {t.balance}")

    # 2. Check if strict math holds: PrevBal + Cr - Dr = CurrentBal
    print("\n--- MATH CHECK (Sequence) ---")
    correct_chain = True
    for i in range(len(txns)-1, 0, -1):
        prev = txns[i]   # Older
        curr = txns[i-1] # Newer
        
        expected = round(prev.balance + curr.credit - curr.debit, 2)
        actual = curr.balance
        
        match = abs(expected - actual) < 0.1
        status = "✅" if match else f"❌ Exp: {expected}"
        print(f"Txn {curr.date_str}: {status} | Actual: {actual}")
        if not match: correct_chain = False
        
    if not correct_chain:
        print("\n⚠️ BALANCE CHAIN IS BROKEN. Insertion Order != Logical Order.")
    else:
        print("\n✅ Balance logic aligns with Sort Order.")

if __name__ == "__main__":
    asyncio.run(check_balance_logic())
