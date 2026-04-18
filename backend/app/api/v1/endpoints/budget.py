from fastapi import APIRouter, Depends, Query, Body, HTTPException
from typing import List, Optional
from app.utils.dependencies import get_current_user
from app.models.budget import BudgetEntry, CalculationRow
from datetime import datetime
from pydantic import BaseModel
from beanie import PydanticObjectId

router = APIRouter(prefix="/budget", tags=["budget"])

class IncomePayload(BaseModel):
    amount: float
    month: int
    year: int

class BudgetPayload(BaseModel):
    category: str
    title: Optional[str] = None
    amount: float
    calculation_rows: Optional[List[CalculationRow]] = None
    type: str = "expense"
    notes: Optional[str] = None
    month: int
    year: int
class ClonePayload(BaseModel):
    from_month: int
    from_year: int
    to_month: int
    to_year: int


@router.get("/stats/summary")
async def get_monthly_summary_stats(
    month: int = Query(...),
    year: int = Query(...),
    user = Depends(get_current_user)
):
    """
    Returns aggregated income, expenses, and savings rate 
    specifically for the Speedometer and Summary Cards.
    """
    user_id = PydanticObjectId(user["user_id"])
    
    # Fetch all items for the month
    items = await BudgetEntry.find(
        BudgetEntry.user_id == user_id,
        BudgetEntry.month == month,
        BudgetEntry.year == year
    ).to_list()

    income = sum(item.amount for item in items if item.type == "income")
    expenses = sum(item.amount for item in items if item.type == "expense")
    
    # Calculate savings logic
    savings = max(0, income - expenses)
    savings_rate = (savings / income * 100) if income > 0 else 0

    return {
        "income": income,
        "expenses": expenses,
        "savings": savings,
        "savings_rate": round(savings_rate, 2),
        "item_count": len(items)
    }
        
@router.delete("/purge")
async def purge_monthly_budget(
    month: int = Query(...),
    year: int = Query(...),
    user = Depends(get_current_user)
):
    user_id = PydanticObjectId(user["user_id"])
    
    # Delete all properties (both income and expense)
    result = await BudgetEntry.find(
        BudgetEntry.user_id == user_id,
        BudgetEntry.month == month,
        BudgetEntry.year == year
    ).delete()
    
    return {"status": "success", "deleted_count": result.deleted_count}
@router.post("/clone")
async def clone_monthly_plan(
    payload: ClonePayload,
    user = Depends(get_current_user)
):
    user_id = PydanticObjectId(user["user_id"])
    
    # 1. Fetch all items from previous month (both income and expenses)
    previous_items = await BudgetEntry.find(
        BudgetEntry.user_id == user_id,
        BudgetEntry.month == payload.from_month,
        BudgetEntry.year == payload.from_year
    ).to_list()

    if not previous_items:
        raise HTTPException(status_code=404, detail="No items found in previous month to clone")

    # 2. Prepare new items (resetting IDs and completion status)
    new_entries = []
    for item in previous_items:
        new_entries.append(BudgetEntry(
            user_id=user_id,
            category=item.category,
            title=item.title,
            type=item.type,
            amount=item.amount,
            calculation_rows=item.calculation_rows,
            month=payload.to_month,
            year=payload.to_year,
            is_completed=False  # Important: New month starts unpaid
        ))

    # 3. Batch insert
    await BudgetEntry.insert_many(new_entries)
    
    return {"status": "success", "cloned_count": len(new_entries)}
@router.get("/list")
async def get_budgets(
    month: int = Query(...),
    year: int = Query(...),
    user = Depends(get_current_user)
):
    user_id = PydanticObjectId(user["user_id"])
    items = await BudgetEntry.find(
        BudgetEntry.user_id == user_id,
        BudgetEntry.month == month,
        BudgetEntry.year == year
    ).to_list()
    # Serialize for JSON
    serialized = []
    for item in items:
        serialized.append({
            "_id": str(item.id),
            "category": item.category,
            "title": item.title,
            "type": item.type,
            "amount": item.amount,
            "is_completed": item.is_completed,
            "month": item.month,
            "year": item.year,
            "calculation_rows": [
                {"description": r.description, "amount": r.amount}
                for r in (item.calculation_rows or [])
            ] if item.calculation_rows else []
        })
    return {"items": serialized}

@router.post("/")
async def add_budget_item(
    payload: BudgetPayload,
    user = Depends(get_current_user)
):
    user_id = PydanticObjectId(user["user_id"])
    
    budget_item = BudgetEntry(
        user_id=user_id,
        category=payload.category,
        title=payload.title,
        type=payload.type,
        amount=payload.amount,
        notes=payload.notes,
        calculation_rows=payload.calculation_rows,
        month=payload.month,
        year=payload.year,
        is_completed=False
    )
    await budget_item.insert()
    return {
        "_id": str(budget_item.id),
        "category": budget_item.category,
        "title": budget_item.title,
        "type": budget_item.type,
        "amount": budget_item.amount,
        "notes": budget_item.notes,
        "is_completed": budget_item.is_completed,
        "month": budget_item.month,
        "year": budget_item.year,
        "calculation_rows": [
            {"description": r.description, "amount": r.amount}
            for r in (budget_item.calculation_rows or [])
        ]
    }

@router.post("/income")
async def upsert_income(
    payload: IncomePayload,
    user = Depends(get_current_user)
):
    user_id = PydanticObjectId(user["user_id"])
    
    existing_income = await BudgetEntry.find_one(
        BudgetEntry.user_id == user_id,
        BudgetEntry.month == payload.month,
        BudgetEntry.year == payload.year,
        BudgetEntry.type == "income"
    )

    if existing_income:
        existing_income.amount = payload.amount
        await existing_income.save()
        return existing_income
    
    new_income = BudgetEntry(
        user_id=user_id,
        category="Monthly Income",
        title="Income",
        type="income",
        amount=payload.amount,
        month=payload.month,
        year=payload.year,
        is_completed=True 
    )
    await new_income.insert()
    return new_income

@router.put("/{id}")
async def update_budget_item(
    id: str,
    payload: BudgetPayload,
    user = Depends(get_current_user)
):
    item = await BudgetEntry.get(id)
    if not item or item.user_id != PydanticObjectId(user["user_id"]):
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.category = payload.category
    item.title = payload.title
    item.type = payload.type
    item.amount = payload.amount
    item.notes = payload.notes
    item.calculation_rows = payload.calculation_rows
    item.month = payload.month
    item.year = payload.year

    await item.save()
    return {
        "_id": str(item.id),
        "category": item.category,
        "title": item.title,
        "type": item.type,
        "amount": item.amount,
        "notes": item.notes,
        "is_completed": item.is_completed,
        "month": item.month,
        "year": item.year,
        "calculation_rows": [
            {"description": r.description, "amount": r.amount}
            for r in (item.calculation_rows or [])
        ]
    }

@router.patch("/{id}/toggle")
async def toggle_status(id: str, user = Depends(get_current_user)):
    item = await BudgetEntry.get(id)
    if not item or item.user_id != PydanticObjectId(user["user_id"]):
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.is_completed = not item.is_completed
    await item.save()
    return item

@router.delete("/{id}")
async def delete_budget_item(id: str, user = Depends(get_current_user)):
    item = await BudgetEntry.get(id)
    if not item or item.user_id != PydanticObjectId(user["user_id"]):
        raise HTTPException(status_code=404, detail="Item not found")
    
    await item.delete()
    return {"status": "success"}