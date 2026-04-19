from typing import Optional
from datetime import datetime
from beanie import Document, PydanticObjectId
from pydantic import Field


class IncomeEntry(Document):
    user_id: PydanticObjectId = Field(index=True)

    source: str                   # e.g., "Salary", "Freelance", "Rental"
    amount: float
    frequency: str = "one-time"   # one-time | monthly | weekly | yearly
    received_date: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "income_entries"
