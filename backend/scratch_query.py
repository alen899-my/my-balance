import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.transaction import Transaction
from beanie.operators import RegEx, Or
import os
from dotenv import load_dotenv

load_dotenv()

async def debug_search():
    client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
    db = client[os.getenv("DB_NAME")]
    await init_beanie(database=db, document_models=[Transaction])
    
    # 1. Total txns
    count = await Transaction.count()
    print("Total Transactions:", count)
    
    # 2. find any txn with 'GYOTHI' case-insensitive in raw Mongo
    raw_res = await Transaction.find({"$or": [{"description": {"$regex": "GYOTHI", "$options": "i"}}, {"payee": {"$regex": "GYOTHI", "$options": "i"}}]}).to_list(100)
    print("Raw match count:", len(raw_res))

    # 3. Simulate backend query logic with raw dict
    find_query = Transaction.find()
    find_query = find_query.find({"$or": [
                {"description": {"$regex": "GYOTHI", "$options": "i"}},
                {"payee": {"$regex": "GYOTHI", "$options": "i"}}
            ]})
    print("Dict chained match:", await find_query.count())

    # 4. Simulate backend query logic with RegEx
    q2 = Transaction.find()
    q2 = q2.find(Or(RegEx(Transaction.description, "GYOTHI", "i"), RegEx(Transaction.payee, "GYOTHI", "i")))
    print("Beanie RegEx match:", await q2.count())

    # 4. Show the actual strings containing gyothi
    if raw_res:
        for r in raw_res:
            print(f"Desc: {r.description} | Payee: {r.payee}")

if __name__ == "__main__":
    asyncio.run(debug_search())
