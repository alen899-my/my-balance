from typing import Optional, List
from datetime import datetime
from beanie import Document, Indexed
from pydantic import Field, BaseModel

class CalculationRow(BaseModel):
    label: str
    value: float

class BudgetEntry(Document):
    user_id: Indexed(str)
    category: str
    title: Optional[str] = None
    type: str = "expense"  # "income" or "expense"
    
    amount: float
    calculation_rows: Optional[List[CalculationRow]] = None
    
    is_completed: bool = False
    
    month: int
    year: int
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "budget_entries"