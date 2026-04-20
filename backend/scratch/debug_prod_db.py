import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_db():
    uri = 'mongodb+srv://alenjames899_db_user:yoJXZQygFo3Kk08l@cluster0.7ttpoml.mongodb.net/?appName=Cluster0'
    client = AsyncIOMotorClient(uri)
    db = client.get_database('bankDb') # THE REAL DB
    
    # Check total budget entries
    total_budget = await db.budget_entries.count_documents({})
    print(f"Total Budget Entries in bankDb: {total_budget}")
    
    sample = await db.budget_entries.find_one({})
    if sample:
        print(f"Sample Entry Content: {sample}")
    else:
        print("Empty budget_entries collection in bankDb")

if __name__ == "__main__":
    # Check if motor exists, if not use pymongo sync
    try:
        asyncio.run(check_db())
    except ImportError:
        from pymongo import MongoClient
        client = MongoClient('mongodb+srv://alenjames899_db_user:yoJXZQygFo3Kk08l@cluster0.7ttpoml.mongodb.net/?appName=Cluster0')
        db = client['bankDb']
        total = db.budget_entries.count_documents({})
        print(f"Total Budget Entries in bankDb (sync): {total}")
        sample = db.budget_entries.find_one({})
        print(f"Sample: {sample}")
