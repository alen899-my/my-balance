from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from beanie import PydanticObjectId

from app.utils.dependencies import get_current_user
from app.models.property import PropertyAsset

router = APIRouter(prefix="/properties", tags=["properties"])

class PropertyPayload(BaseModel):
    type: str                # e.g., "Land", "House", "Building"
    title: str               # e.g., "Munnar Plot", "City Apartment"
    cent_area: Optional[float] = None
    purchase_price: float
    current_value: Optional[float] = None
    purchase_date: Optional[datetime] = None
    image_url: Optional[str] = None
    note: Optional[str] = None

def _serialize(p: PropertyAsset) -> dict:
    return {
        "_id": str(p.id),
        "type": p.type,
        "title": p.title,
        "cent_area": p.cent_area,
        "purchase_price": p.purchase_price,
        "current_value": p.current_value,
        "purchase_date": p.purchase_date.isoformat(),
        "image_url": p.image_url,
        "note": p.note,
        "created_at": p.created_at.isoformat(),
    }

@router.get("/")
async def get_properties(user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    properties = await PropertyAsset.find(PropertyAsset.user_id == uid).sort("-purchase_date").to_list()
    return {"items": [_serialize(p) for p in properties]}

@router.post("/")
async def add_property(payload: PropertyPayload, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    prop = PropertyAsset(
        user_id=uid,
        type=payload.type,
        title=payload.title,
        cent_area=payload.cent_area,
        purchase_price=payload.purchase_price,
        current_value=payload.current_value,
        purchase_date=payload.purchase_date or datetime.utcnow(),
        image_url=payload.image_url,
        note=payload.note,
    )
    await prop.insert()
    return _serialize(prop)

@router.put("/{id}")
async def update_property(id: str, payload: PropertyPayload, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    prop = await PropertyAsset.get(id)
    if not prop or prop.user_id != uid:
        raise HTTPException(status_code=404, detail="Property not found")

    prop.type = payload.type
    prop.title = payload.title
    prop.cent_area = payload.cent_area
    prop.purchase_price = payload.purchase_price
    prop.current_value = payload.current_value
    prop.purchase_date = payload.purchase_date or prop.purchase_date
    prop.image_url = payload.image_url
    prop.note = payload.note
    prop.updated_at = datetime.utcnow()
    
    await prop.save()
    return _serialize(prop)

@router.delete("/{id}")
async def delete_property(id: str, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    prop = await PropertyAsset.get(id)
    if not prop or prop.user_id != uid:
        raise HTTPException(status_code=404, detail="Property not found")

    await prop.delete()
    return {"status": "deleted"}
