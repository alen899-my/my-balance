from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from app.utils.dependencies import get_current_user
from app.models.daily_budget import DailyBudgetEntry, CalculationRow
from datetime import datetime, date, timedelta
from pydantic import BaseModel
from beanie import PydanticObjectId

router = APIRouter(prefix="/daily-budget", tags=["daily-budget"])

# ─── Payloads ────────────────────────────────────────────────────────────────

class DailyBudgetPayload(BaseModel):
    category: str
    title: Optional[str] = None
    amount: float
    calculation_rows: Optional[List[CalculationRow]] = None
    type: str = "expense"  # "income" or "expense"
    entry_date: date        # Format: YYYY-MM-DD
    receipt_url: Optional[str] = None  # From Vercel Blob upload

class DailyBudgetUpdatePayload(BaseModel):
    category: Optional[str] = None
    title: Optional[str] = None
    amount: Optional[float] = None
    calculation_rows: Optional[List[CalculationRow]] = None
    type: Optional[str] = None
    receipt_url: Optional[str] = None

# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/day")
async def get_day_entries(
    target_date: date = Query(default_factory=date.today),
    user = Depends(get_current_user)
):
    """Returns all manual + bank-synced entries for a specific day."""
    user_id_str = str(user["user_id"])
    py_user_id = PydanticObjectId(user["user_id"])

    # 1. Manual entries
    manual_items = await DailyBudgetEntry.find(
        DailyBudgetEntry.user_id == py_user_id,
        DailyBudgetEntry.entry_date == target_date
    ).to_list()

    result = []
    for item in manual_items:
        result.append({
            "_id": str(item.id),
            "title": item.title,
            "description": item.title,  # frontend description column
            "category": item.category or "Uncategorized",
            "amount": item.amount,
            "type": item.type,
            "entry_date": item.entry_date.isoformat(),
            "source": "manual",
            "bank": "Manually Added",
            "receipt_url": item.receipt_url or None,
            "calculation_rows": [
                {"description": r.description, "amount": r.amount}
                for r in (item.calculation_rows or [])
            ]
        })

    # 2. Synced bank transactions for that day
    from app.models.transaction import Transaction
    col = Transaction.get_pymongo_collection()
    start_dt = datetime.combine(target_date, datetime.min.time())
    end_dt = datetime.combine(target_date, datetime.max.time())

    bank_txns = await col.find({
        "user_id": user_id_str,
        "date": {"$gte": start_dt, "$lte": end_dt}
    }).to_list(length=500)

    for txn in bank_txns:
        debit = txn.get("debit", 0) or 0
        credit = txn.get("credit", 0) or 0
        if credit > 0:
            type_val = "income"
            amt = credit
        else:
            type_val = "expense"
            amt = debit

        result.append({
            "_id": str(txn.get("_id")),
            "title": txn.get("payee") or txn.get("description") or "Bank Transfer",
            "category": txn.get("category") or ("Income" if type_val == "income" else "Uncategorized"),
            "amount": amt,
            "type": type_val,
            "entry_date": target_date.isoformat(),
            "source": "bank_statement",
            "bank": txn.get("bank", ""),
            "description": txn.get("description", ""),
            "receipt_url": None,
        })

    income = sum(i["amount"] for i in result if i["type"] == "income")
    expenses = sum(i["amount"] for i in result if i["type"] == "expense")

    return {
        "date": target_date.isoformat(),
        "items": result,
        "total_income": income,
        "total_expenses": expenses,
        "balance": income - expenses,
    }


@router.get("/summary")
async def get_daily_summary(
    target_date: date = Query(default_factory=date.today),
    user = Depends(get_current_user)
):
    """Returns total income, expenses, and net balance for a specific day."""
    user_id = PydanticObjectId(user["user_id"])

    items = await DailyBudgetEntry.find(
        DailyBudgetEntry.user_id == user_id,
        DailyBudgetEntry.entry_date == target_date
    ).to_list()

    income = sum(i.amount for i in items if i.type == "income")
    expenses = sum(i.amount for i in items if i.type == "expense")

    return {
        "date": target_date,
        "total_income": income,
        "total_expenses": expenses,
        "balance": income - expenses,
        "items_count": len(items)
    }


@router.get("/range")
async def get_range_stats(
    start_date: date = Query(...),
    end_date: date = Query(...),
    user = Depends(get_current_user)
):
    """Fetches all entries between two dates, merging manual + bank transactions."""
    user_id = str(user["user_id"])
    py_user_id = PydanticObjectId(user["user_id"])

    manual_items = await DailyBudgetEntry.find(
        DailyBudgetEntry.user_id == py_user_id,
        DailyBudgetEntry.entry_date >= start_date,
        DailyBudgetEntry.entry_date <= end_date
    ).to_list()

    unified_items = []

    for item in manual_items:
        unified_items.append({
            "_id": str(item.id),
            "title": item.title,
            "category": item.category or "Uncategorized",
            "amount": item.amount,
            "type": item.type,
            "entry_date": item.entry_date.isoformat(),
            "source": "manual",
            "receipt_url": item.receipt_url or None,
            "calculation_rows": [{"description": r.description, "amount": r.amount} for r in (item.calculation_rows or [])]
        })

    from app.models.transaction import Transaction
    col = Transaction.get_pymongo_collection()

    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())

    pipeline = [{"$match": {"user_id": user_id, "date": {"$gte": start_dt, "$lte": end_dt}}}]
    bank_txns = await col.aggregate(pipeline).to_list(length=1000)

    for txn in bank_txns:
        debit = txn.get("debit")
        credit = txn.get("credit")
        if credit and credit > 0:
            type_val = "income"
            amt = credit
        else:
            type_val = "expense"
            amt = debit or 0

        unified_items.append({
            "_id": str(txn.get("_id")),
            "title": txn.get("payee") or txn.get("narrative") or "Bank Transfer",
            "category": txn.get("category") or ("Income" if type_val == "income" else "Uncategorized"),
            "amount": amt,
            "type": type_val,
            "entry_date": txn.get("date").date().isoformat() if txn.get("date") else start_date.isoformat(),
            "source": "bank_statement",
            "bank": txn.get("bank", ""),
            "receipt_url": None,
        })

    unified_items.sort(key=lambda x: x["entry_date"])

    return {
        "start": start_date,
        "end": end_date,
        "items": unified_items,
        "total_period_expense": sum(i["amount"] for i in unified_items if i["type"] == "expense")
    }


@router.post("/")
async def add_daily_item(
    payload: DailyBudgetPayload,
    user = Depends(get_current_user)
):
    """Creates a new manual daily transaction entry."""
    user_id = PydanticObjectId(user["user_id"])

    entry = DailyBudgetEntry(
        user_id=user_id,
        category=payload.category,
        title=payload.title,
        type=payload.type,
        amount=payload.amount,
        calculation_rows=payload.calculation_rows,
        receipt_url=payload.receipt_url,
        entry_date=payload.entry_date,
        month=payload.entry_date.month,
        year=payload.entry_date.year,
        is_completed=True
    )
    await entry.insert()

    return {
        "_id": str(entry.id),
        "title": entry.title,
        "category": entry.category,
        "amount": entry.amount,
        "type": entry.type,
        "entry_date": entry.entry_date.isoformat(),
        "receipt_url": entry.receipt_url,
        "source": "manual",
        "calculation_rows": [{"description": r.description, "amount": r.amount} for r in (entry.calculation_rows or [])]
    }


@router.put("/{id}")
async def update_daily_item(
    id: str,
    payload: DailyBudgetUpdatePayload,
    user = Depends(get_current_user)
):
    """Updates an existing manual daily entry."""
    user_id = PydanticObjectId(user["user_id"])

    try:
        obj_id = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    item = await DailyBudgetEntry.find_one(
        DailyBudgetEntry.id == obj_id,
        DailyBudgetEntry.user_id == user_id
    )

    if not item:
        raise HTTPException(status_code=404, detail="Entry not found")

    update_data = payload.dict(exclude_unset=True)
    if update_data:
        await item.set(update_data)

    return {"status": "success", "message": "Entry updated"}


@router.get("/top-categories")
async def get_top_categories(
    days: int = Query(7, description="Number of past days to analyze"),
    user = Depends(get_current_user)
):
    """Groups expenses by category over the last X days."""
    user_id = PydanticObjectId(user["user_id"])
    start_threshold = date.today() - timedelta(days=days)

    items = await DailyBudgetEntry.find(
        DailyBudgetEntry.user_id == user_id,
        DailyBudgetEntry.entry_date >= start_threshold,
        DailyBudgetEntry.type == "expense"
    ).to_list()

    category_map = {}
    for item in items:
        category_map[item.category] = category_map.get(item.category, 0) + item.amount

    sorted_categories = dict(sorted(category_map.items(), key=lambda x: x[1], reverse=True))

    return {
        "analysis_period_days": days,
        "categories": sorted_categories
    }


@router.delete("/{id}")
async def delete_daily_item(id: str, user = Depends(get_current_user)):
    """Deletes a specific daily entry by its MongoDB ID."""
    user_id = PydanticObjectId(user["user_id"])

    try:
        obj_id = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    item = await DailyBudgetEntry.find_one(
        DailyBudgetEntry.id == obj_id,
        DailyBudgetEntry.user_id == user_id
    )

    if not item:
        raise HTTPException(status_code=404, detail="Entry not found")

    await item.delete()
    return {"status": "success"}