from typing import Optional
from datetime import datetime
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

class WalletTransaction(Document):
    user_id: PydanticObjectId = Field(index=True)
    description: str
    amount: float
    type: str  # "add", "spend", "set_balance"
    category: str
    receipt_url: Optional[str] = None
    transaction_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Time partitioning
    month: int
    year: int

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "wallet_transactions"
