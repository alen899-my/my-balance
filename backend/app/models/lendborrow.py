from typing import Optional
from datetime import datetime
from beanie import Document, PydanticObjectId
from pydantic import Field


class LendBorrowEntry(Document):
    user_id: PydanticObjectId = Field(index=True)

    # Contact info
    name: str
    phone: Optional[str] = None

    # Transaction details
    amount: float
    direction: str  # "lent" (I gave money) | "borrowed" (I took money)
    date: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = None

    # Settlement
    is_settled: bool = False
    settled_date: Optional[datetime] = None  # Original automated field
    completion_date: Optional[datetime] = None  # Explicit user-editable field

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "lend_borrow_entries"
