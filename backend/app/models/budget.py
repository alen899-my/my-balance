from typing import Optional
from datetime import datetime
from beanie import Document, Indexed
from pydantic import Field

class MonthlyBudget(Document):
    user_id: Indexed(str)
    category: str
    
    
    type: str = "expense"  # "income" or "expense"
    note: Optional[str] = None
  

    amount_per_unit: float
    units: int = 1
    total_amount: float
    
    is_completed: bool = False
    
    month: int
    year: int
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "monthly_budgets"