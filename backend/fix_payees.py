import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import UpdateOne
from app.utils.normalize import extract_payee_refined
from app.utils.analysis import classify_category

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "bank_app_db")

async def fix_payees():
    print("🚀 Starting Payee & Category Repair...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    col = db["transactions"]
    
    cursor = col.find({})
    
    batch = []
    count = 0
    updated_count = 0
    
    async for txn in cursor:
        desc = txn.get("description", "")
        # Re-run extraction with NEW regex
        clean_payee = extract_payee_refined(desc)
        
        # If extraction failed (still returns raw desc), limit it
        # extract_payee_refined fallback is desc[:25]. 
        # If desc starts with "UPI", falling back to "UPI IN/109..." is bad.
        # Let's force a better fallback for UPI if it fails regex.
        if "UPI" in clean_payee and "/" in clean_payee:
             clean_payee = "UPI Transfer"
        
        # Re-run classification
        cat = classify_category(clean_payee)
        
        batch.append(
            UpdateOne(
                {"_id": txn["_id"]}, 
                {"$set": {"payee": clean_payee, "category": cat}}
            )
        )
        
        if len(batch) >= 1000:
            await col.bulk_write(batch)
            updated_count += len(batch)
            batch = []
            print(f"Processed {updated_count}...")

    if batch:
        await col.bulk_write(batch)
        updated_count += len(batch)
        
    print(f"✅ Repair Complete. Updated {updated_count} transactions.")

if __name__ == "__main__":
    asyncio.run(fix_payees())
