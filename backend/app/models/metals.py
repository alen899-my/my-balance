from typing import Optional
from datetime import datetime
from beanie import Document, PydanticObjectId
from pydantic import Field


class MetalAsset(Document):
    user_id: PydanticObjectId = Field(index=True)

    # Metal details
    metal_type: str          # "XAU" | "XAG" | "XPT" | "XPD"
    item_name: str           # e.g. "Gold Ring", "Silver Bar"
    quantity: float          # in grams
    purchase_price: float    # price paid per gram at time of purchase (in user's currency)
    purchase_date: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = None
    image_url: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "metal_assets"
