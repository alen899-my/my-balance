from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from beanie import PydanticObjectId

from app.utils.dependencies import get_current_user
from app.models.income import IncomeEntry

router = APIRouter(prefix="/income", tags=["income"])


class IncomePayload(BaseModel):
    source: str
    amount: float
    frequency: str = "one-time"
    received_date: Optional[datetime] = None
    note: Optional[str] = None


def _serialize(e: IncomeEntry) -> dict:
    return {
        "_id": str(e.id),
        "source": e.source,
        "amount": e.amount,
        "frequency": e.frequency,
        "received_date": e.received_date.isoformat(),
        "note": e.note,
        "created_at": e.created_at.isoformat(),
    }


@router.get("/")
async def list_income(user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    items = await IncomeEntry.find(IncomeEntry.user_id == uid).sort("-received_date").to_list()
    total = sum(i.amount for i in items)
    return {"items": [_serialize(i) for i in items], "total": total}


@router.post("/")
async def add_income(payload: IncomePayload, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    entry = IncomeEntry(
        user_id=uid,
        source=payload.source,
        amount=payload.amount,
        frequency=payload.frequency,
        received_date=payload.received_date or datetime.utcnow(),
        note=payload.note,
    )
    await entry.insert()
    return _serialize(entry)


@router.put("/{id}")
async def update_income(id: str, payload: IncomePayload, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    entry = await IncomeEntry.get(id)
    if not entry or entry.user_id != uid:
        raise HTTPException(status_code=404, detail="Income entry not found")

    entry.source = payload.source
    entry.amount = payload.amount
    entry.frequency = payload.frequency
    entry.received_date = payload.received_date or entry.received_date
    entry.note = payload.note
    entry.updated_at = datetime.utcnow()

    await entry.save()
    return _serialize(entry)


@router.delete("/{id}")
async def delete_income(id: str, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    entry = await IncomeEntry.get(id)
    if not entry or entry.user_id != uid:
        raise HTTPException(status_code=404, detail="Income entry not found")

    await entry.delete()
    return {"status": "deleted"}
