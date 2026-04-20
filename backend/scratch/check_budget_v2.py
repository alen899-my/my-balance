import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.budget import BudgetEntry
from beanie import init_beanie
from bson import ObjectId

async def check_budget():
    uri = "mongodb+srv://alenjames899_db_user:yoJXZQygFo3Kk08l@cluster0.7ttpoml.mongodb.net/?appName=Cluster0"
    client = AsyncIOMotorClient(uri)
    await init_beanie(database=client.bankDb, document_models=[BudgetEntry])
    
    entries = await BudgetEntry.find_all().to_list()
    print(f"Total Budget Entries: {len(entries)}")
    for e in entries[:20]:
        print(f"ID: {e.id}, User: {e.user_id}, Title: {e.title}, Category: {e.category}, Amount: {e.amount}, Month: {e.month}/{e.year}")

if __name__ == "__main__":
    asyncio.run(check_budget())
