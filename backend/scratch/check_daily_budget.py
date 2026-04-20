import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.daily_budget import DailyBudgetEntry
from beanie import init_beanie
from bson import ObjectId

async def check_daily_budget():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(database=client.bank_app, document_models=[DailyBudgetEntry])
    
    entries = await DailyBudgetEntry.find_all().to_list()
    print(f"Total Daily Budget Entries: {len(entries)}")
    for e in entries[:20]:
        print(f"ID: {e.id}, Title: {e.title}, Category: {e.category}, Amount: {e.amount}, Date: {e.entry_date}")

if __name__ == "__main__":
    asyncio.run(check_daily_budget())
