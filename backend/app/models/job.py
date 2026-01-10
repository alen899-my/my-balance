from beanie import Document
from datetime import datetime
from typing import Optional

class JobStatus(Document):
    job_id: str
    status: str  # "processing", "completed", "failed"
    total_pages: int = 0
    processed_pages: int = 0
    total_txns: int = 0
    processed_txns: int = 0
    message: str = ""
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "job_statuses"