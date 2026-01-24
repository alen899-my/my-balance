from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from app.utils.dependencies import get_current_user
from app.models.daily_budget import DailyBudgetEntry, CalculationRow
from datetime import datetime, date, timedelta
from pydantic import BaseModel
from beanie import PydanticObjectId

router = APIRouter(prefix="/daily-budget", tags=["daily-budget"])

# --- Payloads ---

class DailyBudgetPayload(BaseModel):
    category: str
    title: Optional[str] = None
    amount: float
    calculation_rows: Optional[List[CalculationRow]] = None
    type: str = "expense"  # "income" or "expense"
    entry_date: date       # Format: YYYY-MM-DD

# --- Endpoints ---

@router.get("/summary")
async def get_daily_summary(
    target_date: date = Query(default_factory=date.today),
    user = Depends(get_current_user)
):
    """
    Returns total income, expenses, and net balance for a specific day.
    Used for the 'Daily Net' summary cards.
    """
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
    """
    Fetches all entries between two dates.
    Used for the daily list and custom range reporting.
    """
    user_id = PydanticObjectId(user["user_id"])
    
    items = await DailyBudgetEntry.find(
        DailyBudgetEntry.user_id == user_id,
        DailyBudgetEntry.entry_date >= start_date,
        DailyBudgetEntry.entry_date <= end_date
    ).sort(+DailyBudgetEntry.entry_date).to_list()

    return {
        "start": start_date,
        "end": end_date,
        "items": items,
        "total_period_expense": sum(i.amount for i in items if i.type == "expense")
    }

@router.post("/")
async def add_daily_item(
    payload: DailyBudgetPayload,
    user = Depends(get_current_user)
):
    """
    Creates a new daily transaction. 
    Automatically maps the month and year for cross-compatibility with monthly views.
    """
    user_id = PydanticObjectId(user["user_id"])
    
    entry = DailyBudgetEntry(
        user_id=user_id,
        category=payload.category,
        title=payload.title,
        type=payload.type,
        amount=payload.amount,
        calculation_rows=payload.calculation_rows,
        entry_date=payload.entry_date,
        month=payload.entry_date.month,
        year=payload.entry_date.year,
        is_completed=True 
    )
    await entry.insert()
    return entry

@router.get("/top-categories")
async def get_top_categories(
    days: int = Query(7, description="Number of past days to analyze"),
    user = Depends(get_current_user)
):
    """
    Aggregation use-case: Groups expenses by category over the last X days 
    to show where the user is spending the most.
    """
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

    # Sort categories by amount descending
    sorted_categories = dict(sorted(category_map.items(), key=lambda x: x[1], reverse=True))
    
    return {
        "analysis_period_days": days,
        "categories": sorted_categories
    }

@router.delete("/{id}")
async def delete_daily_item(id: str, user = Depends(get_current_user)):
    user_id = PydanticObjectId(user["user_id"])
    
    try:
        obj_id = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # Fetch item ensuring it belongs to the current user
    item = await DailyBudgetEntry.find_one(
        DailyBudgetEntry.id == obj_id, 
        DailyBudgetEntry.user_id == user_id
    )
    
    if not item:
        raise HTTPException(status_code=404, detail="Entry not found")
        
    await item.delete()
    return {"status": "success"}
    """
    Deletes a specific entry by its MongoDB ID.
    """
    user_id = PydanticObjectId(user["user_id"])
    
    # Ensure the ID is a valid PydanticObjectId for Beanie
    try:
        obj_id = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    item = await DailyBudgetEntry.get(obj_id)
    
    if not item or item.user_id != user_id:
        raise HTTPException(status_code=404, detail="Entry not found or unauthorized")
        
    await item.delete()
    return {"status": "success", "message": "Transaction deleted"}