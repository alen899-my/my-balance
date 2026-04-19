from typing import Optional
from datetime import datetime, date
from beanie import Document, PydanticObjectId
from pydantic import Field


class EMIEntry(Document):
    user_id: PydanticObjectId = Field(index=True)

    # Core loan details
    name: str                           # e.g. "Home Loan - SBI"
    category: str = "Personal Loan"
    bank_name: Optional[str] = None

    # Financial inputs
    principal: float
    annual_interest_rate: float               # % e.g. 8.5
    tenure_months: int
    start_date: date
    custom_monthly_amount: Optional[float] = None  # user override; if set, used instead of formula

    # Payment day & notification
    payment_day: int = 1                # Day of month EMI is due (1–28)
    notify: bool = False
    notify_days_before: int = 3
    last_notified_date: Optional[str] = None   # "YYYY-MM-DD" per-day dedup
    user_email: Optional[str] = None           # stored from JWT for scheduler

    # State
    is_active: bool = True
    note: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "emi_entries"
