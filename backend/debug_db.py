import os
import asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME")
    
    print(f"ENV CHECK:")
    print(f"  MONGO_URI: {'[FOUND]' if uri else '[MISSING]'}")
    print(f"  DB_NAME:   {db_name or '[MISSING]'}")
    
    if not uri:
        print("CRITICAL: MONGO_URI is missing. Check your .env file.")
        return

    try:
        client = AsyncIOMotorClient(uri)
        # Force a connection check
        await client.admin.command('ping')
        print("MONGODB CONNECTION: SUCCESS")
        
        db = client[db_name]
        cols = await db.list_collection_names()
        print(f"COLLECTIONS: {cols}")
        
    except Exception as e:
        print(f"MONGODB CONNECTION: FAILED - {e}")

if __name__ == "__main__":
    asyncio.run(check())
