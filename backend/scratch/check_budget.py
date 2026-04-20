import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.budget import BudgetEntry
from beanie import init_beanie
from bson import ObjectId

async def check_budget():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(database=client.bank_app, document_models=[BudgetEntry])
    
    # Assuming the first user for simplicity or searching for specific text
    entries = await BudgetEntry.find_all().to_list()
    print(f"Total Budget Entries: {len(entries)}")
    for e in entries[:20]:
        print(f"ID: {e.id}, Title: {e.title}, Category: {e.category}, Amount: {e.amount}, Month: {e.month}/{e.year}")

if __name__ == "__main__":
    asyncio.run(check_budget())
