from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from beanie import PydanticObjectId

from app.utils.dependencies import get_current_user
from app.models.lendborrow import LendBorrowEntry

router = APIRouter(prefix="/lend-borrow", tags=["lend-borrow"])


# ── Payloads ──────────────────────────────────────────────────────────────────

class LendBorrowPayload(BaseModel):
    name: str
    phone: Optional[str] = None
    amount: float
    direction: str       # "lent" or "borrowed"
    date: Optional[datetime] = None
    note: Optional[str] = None
    is_settled: bool = False
    settled_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None


class SettlePayload(BaseModel):
    is_settled: bool
    settled_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None


# ── Serialiser helper ─────────────────────────────────────────────────────────

def _serialize(e: LendBorrowEntry) -> dict:
    return {
        "_id": str(e.id),
        "name": e.name,
        "phone": e.phone,
        "amount": e.amount,
        "direction": e.direction,
        "date": e.date.isoformat(),
        "note": e.note,
        "is_settled": e.is_settled,
        "settled_date": e.settled_date.isoformat() if e.settled_date else None,
        "completion_date": e.completion_date.isoformat() if e.completion_date else None,
        "created_at": e.created_at.isoformat(),
    }


# ── GET /summary ──────────────────────────────────────────────────────────────

@router.get("/summary")
async def get_summary(user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    entries = await LendBorrowEntry.find(LendBorrowEntry.user_id == uid).to_list()

    total_lent = sum(e.amount for e in entries if e.direction == "lent")
    total_borrowed = sum(e.amount for e in entries if e.direction == "borrowed")
    pending_lent = sum(e.amount for e in entries if e.direction == "lent" and not e.is_settled)
    pending_borrowed = sum(e.amount for e in entries if e.direction == "borrowed" and not e.is_settled)

    return {
        "total_lent": total_lent,
        "total_borrowed": total_borrowed,
        "pending_lent": pending_lent,
        "pending_borrowed": pending_borrowed,
        "net": total_lent - total_borrowed,
    }


# ── GET /list ─────────────────────────────────────────────────────────────────

@router.get("/list")
async def get_entries(
    direction: Optional[str] = Query(None, description="lent | borrowed"),
    is_settled: Optional[bool] = Query(None),
    user=Depends(get_current_user),
):
    uid = PydanticObjectId(user["user_id"])
    query = [LendBorrowEntry.user_id == uid]

    if direction:
        query.append(LendBorrowEntry.direction == direction)
    if is_settled is not None:
        query.append(LendBorrowEntry.is_settled == is_settled)

    entries = await LendBorrowEntry.find(*query).sort("-date").to_list()
    return {"items": [_serialize(e) for e in entries]}


# ── POST / ────────────────────────────────────────────────────────────────────

@router.post("/")
async def create_entry(payload: LendBorrowPayload, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    entry = LendBorrowEntry(
        user_id=uid,
        name=payload.name,
        phone=payload.phone,
        amount=payload.amount,
        direction=payload.direction,
        date=payload.date or datetime.utcnow(),
        note=payload.note,
        is_settled=payload.is_settled,
        settled_date=payload.settled_date,
        completion_date=payload.completion_date,
    )
    await entry.insert()
    return _serialize(entry)


# ── PUT /{id} ─────────────────────────────────────────────────────────────────

@router.put("/{id}")
async def update_entry(id: str, payload: LendBorrowPayload, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    entry = await LendBorrowEntry.get(id)
    if not entry or entry.user_id != uid:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry.name = payload.name
    entry.phone = payload.phone
    entry.amount = payload.amount
    entry.direction = payload.direction
    entry.date = payload.date or entry.date
    entry.note = payload.note
    entry.is_settled = payload.is_settled
    entry.settled_date = payload.settled_date
    entry.completion_date = payload.completion_date
    entry.updated_at = datetime.utcnow()
    await entry.save()
    return _serialize(entry)


# ── PATCH /{id}/settle ────────────────────────────────────────────────────────

@router.patch("/{id}/settle")
async def settle_entry(id: str, payload: SettlePayload, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    entry = await LendBorrowEntry.get(id)
    if not entry or entry.user_id != uid:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry.is_settled = payload.is_settled
    entry.settled_date = payload.settled_date or (datetime.utcnow() if payload.is_settled else None)
    if payload.completion_date:
        entry.completion_date = payload.completion_date
    elif payload.is_settled and not entry.completion_date:
        entry.completion_date = datetime.utcnow()
    elif not payload.is_settled:
        entry.completion_date = None
        
    entry.updated_at = datetime.utcnow()
    await entry.save()
    return _serialize(entry)


# ── DELETE /{id} ──────────────────────────────────────────────────────────────

@router.delete("/{id}")
async def delete_entry(id: str, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    entry = await LendBorrowEntry.get(id)
    if not entry or entry.user_id != uid:
        raise HTTPException(status_code=404, detail="Entry not found")

    await entry.delete()
    return {"status": "deleted"}
