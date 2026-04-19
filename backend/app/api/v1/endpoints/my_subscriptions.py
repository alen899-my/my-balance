from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from beanie import PydanticObjectId

from app.utils.dependencies import get_current_user
from app.models.subscription import Subscription

router = APIRouter(prefix="/my-subscriptions", tags=["my-subscriptions"])


# ── Payload ────────────────────────────────────────────────────────────────────

class SubscriptionPayload(BaseModel):
    name: str
    amount: float
    billing_day: int                   # 1–31
    category: str = "Other"
    is_active: bool = True
    notify: bool = False
    notify_days_before: int = 3
    note: Optional[str] = None


# ── Serializer ─────────────────────────────────────────────────────────────────

def _serialize(s: Subscription) -> dict:
    today = date.today()
    try:
        day = min(s.billing_day, 28)
        next_billing = date(today.year, today.month, day)
        if next_billing <= today:
            if today.month == 12:
                next_billing = date(today.year + 1, 1, day)
            else:
                next_billing = date(today.year, today.month + 1, day)
        days_until = (next_billing - today).days
    except Exception:
        next_billing = None
        days_until = None

    today_str = today.isoformat()
    reminder_sent = getattr(s, "last_notified_date", None) == today_str

    return {
        "_id": str(s.id),
        "name": s.name,
        "amount": s.amount,
        "billing_day": s.billing_day,
        "category": s.category,
        "is_active": s.is_active,
        "notify": s.notify,
        "notify_days_before": s.notify_days_before,
        "note": s.note,
        "next_billing_date": next_billing.isoformat() if next_billing else None,
        "days_until_billing": days_until,
        "reminder_sent_today": reminder_sent,
        "last_notified_date": getattr(s, "last_notified_date", None),
        "created_at": s.created_at.isoformat(),
    }


# ── CRUD Routes ────────────────────────────────────────────────────────────────

@router.get("/")
async def list_subscriptions(user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    items = await Subscription.find(Subscription.user_id == uid).sort("billing_day").to_list()
    total_monthly = sum(s.amount for s in items if s.is_active)
    return {
        "items": [_serialize(s) for s in items],
        "total_monthly": total_monthly,
        "active_count": sum(1 for s in items if s.is_active),
    }


@router.post("/")
async def add_subscription(payload: SubscriptionPayload, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    if not (1 <= payload.billing_day <= 31):
        raise HTTPException(status_code=400, detail="billing_day must be between 1 and 31")

    sub = Subscription(
        user_id=uid,
        user_email=user.get("email", ""),   # stored from JWT for auto-scheduler
        name=payload.name,
        amount=payload.amount,
        billing_day=payload.billing_day,
        category=payload.category,
        is_active=payload.is_active,
        notify=payload.notify,
        notify_days_before=payload.notify_days_before,
        note=payload.note,
    )
    await sub.insert()
    return _serialize(sub)


@router.put("/{id}")
async def update_subscription(id: str, payload: SubscriptionPayload, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    sub = await Subscription.get(id)
    if not sub or sub.user_id != uid:
        raise HTTPException(status_code=404, detail="Subscription not found")

    sub.name = payload.name
    sub.amount = payload.amount
    sub.billing_day = payload.billing_day
    sub.category = payload.category
    sub.is_active = payload.is_active
    sub.notify = payload.notify
    sub.notify_days_before = payload.notify_days_before
    sub.note = payload.note
    # Update email in case user changed it
    sub.user_email = user.get("email", sub.user_email)
    sub.updated_at = datetime.utcnow()

    await sub.save()
    return _serialize(sub)


@router.delete("/{id}")
async def delete_subscription(id: str, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    sub = await Subscription.get(id)
    if not sub or sub.user_id != uid:
        raise HTTPException(status_code=404, detail="Subscription not found")
    await sub.delete()
    return {"status": "deleted"}
