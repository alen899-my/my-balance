from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import Optional

class Goal(Document):
    user_id: str = Field(..., description="ID of the user who owns this goal")
    name: str = Field(..., description="Name of the savings goal (e.g. Emergency Fund)")
    target_amount: float = Field(..., description="The financial target amount")
    current_amount: float = Field(default=0.0, description="Amount currently saved in this vault")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "goals"
