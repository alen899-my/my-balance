import asyncio
import os
from app.models.transaction import Transaction
from app.db.session import init_db
from dotenv import load_dotenv

async def inspect():
    load_dotenv()
    await init_db()
    print("Inspecting Transaction model:")
    print(f"Has get_motor_collection: {hasattr(Transaction, 'get_motor_collection')}")
    print(f"Has get_pymongo_collection: {hasattr(Transaction, 'get_pymongo_collection')}")
    print(f"Has get_collection: {hasattr(Transaction, 'get_collection')}")
    
    try:
        if hasattr(Transaction, 'get_motor_collection'):
            print(f"get_motor_collection returns: {Transaction.get_motor_collection()}")
    except Exception as e:
        print(f"get_motor_collection call failed: {e}")

if __name__ == "__main__":
    asyncio.run(inspect())
