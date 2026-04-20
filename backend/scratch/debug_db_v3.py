import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_db():
    uri = 'mongodb+srv://alenjames899_db_user:yoJXZQygFo3Kk08l@cluster0.7ttpoml.mongodb.net/?appName=Cluster0'
    client = AsyncIOMotorClient(uri)
    db = client.get_database('test')
    
    # Get all users
    users = await db.users.find({}).to_list(length=10)
    print(f"DEBUG: Found {len(users)} users")
    
    for user in users:
        uid = user["_id"]
        # Check budget entries for this user ID (both as ObjectId and String)
        count_obj = await db.budgetentries.count_documents({"user_id": uid})
        count_str = await db.budgetentries.count_documents({"user_id": str(uid)})
        print(f"User: {uid} | Email: {user.get('email')} | ObjCount: {count_obj} | StrCount: {count_str}")
        
    # Check total budget entries
    total_budget = await db.budgetentries.count_documents({})
    print(f"Total Budget Entries: {total_budget}")
    
    # Check sample budget entry
    sample = await db.budgetentries.find_one({})
    if sample:
        print(f"Sample Entry User ID type: {type(sample.get('user_id'))}")
        print(f"Sample Entry Content: {sample}")

if __name__ == "__main__":
    asyncio.run(check_db())
