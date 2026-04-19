from typing import Optional
from datetime import datetime
from beanie import Document, PydanticObjectId
from pydantic import Field


class Subscription(Document):
    user_id: PydanticObjectId = Field(index=True)
    user_email: str = ""               # stored at create-time from JWT for scheduler use

    name: str                          # e.g., "Netflix", "Milk", "Newspaper"
    amount: float                      # cost per cycle
    billing_day: int                   # day of month (1–31) billing occurs
    category: str = "Other"           # e.g., "Streaming", "Food", "Utilities"
    is_active: bool = True

    # Notification settings
    notify: bool = False               # email notification enabled
    notify_days_before: int = 3        # how many days before billing to notify
    last_notified_date: Optional[str] = None  # "YYYY-MM-DD" to avoid duplicate emails on the *same day*

    note: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "subscriptions_manual"
