from typing import Optional
from datetime import datetime
from beanie import Document, PydanticObjectId
from pydantic import Field

class PropertyAsset(Document):
    user_id: PydanticObjectId = Field(index=True)

    # Property details
    type: str                # e.g., "Land", "House", "Building"
    title: str               # e.g., "Munnar Plot", "City Apartment"
    cent_area: Optional[float] = None # Land area in cents, if applicable
    purchase_price: float    # Cost of the property
    current_value: Optional[float] = None # Estimated current value
    purchase_date: datetime = Field(default_factory=datetime.utcnow)
    image_url: Optional[str] = None
    note: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "property_assets"
