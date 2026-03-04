from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import Optional

class CalendarNeed(Document):
    user_id: str = Field(..., description="ID of the user who owns this planned need")
    name: str = Field(..., description="Name of the planned payment (e.g. Rent)")
    amount: float = Field(..., description="The amount to be paid")
    date: datetime = Field(..., description="The date the payment is due")
    is_paid: bool = Field(default=False, description="Whether the payment has been made")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "calendar_needs"
