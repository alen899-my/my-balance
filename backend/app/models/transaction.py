from beanie import Document
from datetime import datetime
from typing import Optional
from pymongo import IndexModel, ASCENDING, DESCENDING

class Transaction(Document):
    user_id: str  # Storing as string to be flexible, or ObjectId if preferred. Using str for now to match legacy.
    account_id: str
    hash: str
    txn_date: Optional[datetime] = None
    date: Optional[datetime] = None
    description: Optional[str] = None
    payee: Optional[str] = None
    category: Optional[str] = "Personal"
    debit: float = 0.0
    credit: float = 0.0
    balance: float = 0.0
    bank: str
    type: Optional[str] = None
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "transactions"
        indexes = [
            IndexModel([("hash", ASCENDING)], unique=True),
            IndexModel([("user_id", ASCENDING), ("date", DESCENDING)]),
            IndexModel([("payee", ASCENDING)]),
        ]
