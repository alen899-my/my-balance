from typing import Optional, List, Annotated
from datetime import datetime
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field, BaseModel

class CalculationRow(BaseModel):
    description: str
    amount: float

class BudgetEntry(Document):
    user_id: Annotated[PydanticObjectId, Indexed()]
    category: str
    title: Optional[str] = None
    type: str = "expense"  # "income" or "expense"
    notes: Optional[str] = None

    amount: float
    calculation_rows: Optional[List[CalculationRow]] = None

    is_completed: bool = False

    month: int
    year: int

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "budget_entries"