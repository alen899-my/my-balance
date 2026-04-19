from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from beanie import PydanticObjectId

from app.utils.dependencies import get_current_user
from app.models.emi import EMIEntry

router = APIRouter(prefix="/emi", tags=["emi"])


# ── Payload ────────────────────────────────────────────────────────────────────

class EMIPayload(BaseModel):
    name: str
    category: str = "Personal Loan"
    bank_name: Optional[str] = None
    principal: float
    annual_interest_rate: float
    tenure_months: int
    start_date: str                       # "YYYY-MM-DD"
    payment_day: int = 1                  # 1–28
    custom_monthly_amount: Optional[float] = None  # overrides formula when set
    notify: bool = False
    notify_days_before: int = 3
    is_active: bool = True
    note: Optional[str] = None


# ── EMI Calculator ─────────────────────────────────────────────────────────────

def _calculate_emi(principal: float, annual_rate: float, tenure_months: int) -> float:
    if annual_rate == 0:
        return round(principal / tenure_months, 2)
    r   = annual_rate / 12 / 100
    n   = tenure_months
    emi = principal * r * (1 + r) ** n / ((1 + r) ** n - 1)
    return round(emi, 2)


def _serialize(e: EMIEntry) -> dict:
    today = date.today()

    monthly_emi    = e.custom_monthly_amount if (e.custom_monthly_amount and e.custom_monthly_amount > 0) \
                     else _calculate_emi(e.principal, e.annual_interest_rate, e.tenure_months)
    total_payable  = round(monthly_emi * e.tenure_months, 2)
    total_interest = round(total_payable - e.principal, 2)

    start            = e.start_date if isinstance(e.start_date, date) else date.fromisoformat(str(e.start_date))
    elapsed          = (today.year - start.year) * 12 + (today.month - start.month)
    months_completed = max(0, min(elapsed, e.tenure_months))
    months_remaining = e.tenure_months - months_completed

    amount_paid         = round(monthly_emi * months_completed, 2)
    outstanding_balance = round(total_payable - amount_paid, 2)
    progress_pct        = round(months_completed / e.tenure_months * 100, 1)

    try:
        completion_date = (start + relativedelta(months=e.tenure_months - 1)).isoformat()
    except Exception:
        completion_date = None

    r = e.annual_interest_rate / 12 / 100
    if months_completed < e.tenure_months and r > 0:
        remaining_principal = round(
            e.principal * ((1 + r) ** e.tenure_months - (1 + r) ** months_completed) /
            ((1 + r) ** e.tenure_months - 1), 2
        )
    else:
        remaining_principal = 0.0
    current_month_interest  = round(remaining_principal * r, 2)
    current_month_principal = round(monthly_emi - current_month_interest, 2)

    # ── Next payment date (uses payment_day) ──────────────────────────────────
    pay_day = min(getattr(e, "payment_day", 1) or 1, 28)
    try:
        nxt = date(today.year, today.month, pay_day)
        if nxt <= today:
            nxt = date(today.year + 1, 1, pay_day) if today.month == 12 else date(today.year, today.month + 1, pay_day)
        next_payment_date  = nxt.isoformat()
        days_until_payment = (nxt - today).days
    except Exception:
        next_payment_date  = None
        days_until_payment = None

    today_str           = today.isoformat()
    reminder_sent_today = getattr(e, "last_notified_date", None) == today_str

    return {
        "_id":                      str(e.id),
        "name":                     e.name,
        "category":                 e.category,
        "bank_name":                e.bank_name,
        "note":                     e.note,
        "is_active":                e.is_active,
        "start_date":               start.isoformat(),
        "completion_date":          completion_date,
        "payment_day":              pay_day,
        "custom_monthly_amount":    getattr(e, "custom_monthly_amount", None),
        "notify":                   getattr(e, "notify", False),
        "notify_days_before":       getattr(e, "notify_days_before", 3),
        "reminder_sent_today":      reminder_sent_today,
        "last_notified_date":       getattr(e, "last_notified_date", None),
        "principal":                e.principal,
        "annual_interest_rate":     e.annual_interest_rate,
        "tenure_months":            e.tenure_months,
        "monthly_emi":              monthly_emi,
        "total_payable":            total_payable,
        "total_interest":           total_interest,
        "months_completed":         months_completed,
        "months_remaining":         months_remaining,
        "amount_paid":              amount_paid,
        "outstanding_balance":      outstanding_balance,
        "remaining_principal":      remaining_principal,
        "progress_pct":             progress_pct,
        "current_month_interest":   current_month_interest,
        "current_month_principal":  current_month_principal,
        "next_payment_date":        next_payment_date,
        "days_until_payment":       days_until_payment,
        "created_at":               e.created_at.isoformat(),
    }


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/")
async def list_emis(user=Depends(get_current_user)):
    uid   = PydanticObjectId(user["user_id"])
    items = await EMIEntry.find(EMIEntry.user_id == uid).sort("start_date").to_list()
    serialized = [_serialize(e) for e in items]
    return {
        "items":                serialized,
        "total_monthly_burden": round(sum(s["monthly_emi"] for s in serialized if s["is_active"] and s["months_remaining"] > 0), 2),
        "total_outstanding":    round(sum(s["outstanding_balance"] for s in serialized if s["is_active"]), 2),
        "active_count":         sum(1 for s in serialized if s["is_active"]),
    }


@router.post("/")
async def add_emi(payload: EMIPayload, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    if payload.principal <= 0:
        raise HTTPException(400, "Principal must be positive")
    if not (0 <= payload.annual_interest_rate <= 100):
        raise HTTPException(400, "Interest rate must be between 0 and 100")
    if payload.tenure_months <= 0:
        raise HTTPException(400, "Tenure must be at least 1 month")

    entry = EMIEntry(
        user_id              = uid,
        name                 = payload.name,
        category             = payload.category,
        bank_name            = payload.bank_name,
        principal            = payload.principal,
        annual_interest_rate = payload.annual_interest_rate,
        tenure_months        = payload.tenure_months,
        start_date           = date.fromisoformat(payload.start_date),
        payment_day          = max(1, min(28, payload.payment_day)),
        custom_monthly_amount= payload.custom_monthly_amount if (payload.custom_monthly_amount and payload.custom_monthly_amount > 0) else None,
        notify               = payload.notify,
        notify_days_before   = payload.notify_days_before,
        is_active            = payload.is_active,
        note                 = payload.note,
        user_email           = user.get("email", ""),
    )
    await entry.insert()
    return _serialize(entry)


@router.put("/{id}")
async def update_emi(id: str, payload: EMIPayload, user=Depends(get_current_user)):
    uid   = PydanticObjectId(user["user_id"])
    entry = await EMIEntry.get(id)
    if not entry or entry.user_id != uid:
        raise HTTPException(404, "EMI not found")

    entry.name                 = payload.name
    entry.category             = payload.category
    entry.bank_name            = payload.bank_name
    entry.principal            = payload.principal
    entry.annual_interest_rate = payload.annual_interest_rate
    entry.tenure_months        = payload.tenure_months
    entry.start_date           = date.fromisoformat(payload.start_date)
    entry.payment_day          = max(1, min(28, payload.payment_day))
    entry.custom_monthly_amount= payload.custom_monthly_amount if (payload.custom_monthly_amount and payload.custom_monthly_amount > 0) else None
    entry.notify               = payload.notify
    entry.notify_days_before   = payload.notify_days_before
    entry.is_active            = payload.is_active
    entry.note                 = payload.note
    entry.user_email           = user.get("email", entry.user_email or "")
    entry.updated_at           = datetime.utcnow()
    await entry.save()
    return _serialize(entry)


@router.delete("/{id}")
async def delete_emi(id: str, user=Depends(get_current_user)):
    uid   = PydanticObjectId(user["user_id"])
    entry = await EMIEntry.get(id)
    if not entry or entry.user_id != uid:
        raise HTTPException(404, "EMI not found")
    await entry.delete()
    return {"status": "deleted"}
