from typing import Optional, List
from datetime import datetime, date
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field, BaseModel

class CalculationRow(BaseModel):
    description: str
    amount: float

class DailyBudgetEntry(Document):
    user_id: Indexed(PydanticObjectId)
    category: str
    title: Optional[str] = None
    type: str = "expense"  # "income" or "expense"
    
    amount: float
    calculation_rows: Optional[List[CalculationRow]] = None
    receipt_url: Optional[str] = None  # Vercel Blob URL for uploaded bill/receipt image
    
    is_completed: bool = False
    
    # Using a date object for specific day tracking
    # Indexed to allow fast lookups for specific days or date ranges
    entry_date: Indexed(date) 
    
    # Keep month/year for easy aggregation/filtering without date math
    month: int
    year: int
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "daily_budget_entries"