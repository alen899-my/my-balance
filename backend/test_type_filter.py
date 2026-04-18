import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.transaction import Transaction

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(database=client.bank_app, document_models=[Transaction])
    
    # Test debit
    count_debit = await Transaction.find(Transaction.debit > 0).count()
    print("Debit transactions:", count_debit)
    
    # Test credit
    count_credit = await Transaction.find(Transaction.credit > 0).count()
    print("Credit transactions:", count_credit)

if __name__ == "__main__":
    asyncio.run(main())
