from fastapi import APIRouter, Depends, Query, Body, HTTPException
from typing import List, Optional
from app.utils.dependencies import get_current_user
from app.models.budget import MonthlyBudget
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/budget", tags=["budget"])

@router.get("/list")
async def get_budgets(
    month: int = Query(...),
    year: int = Query(...),
    user = Depends(get_current_user)
):
    """Get all items and a summary of income vs expenses"""
    user_id = str(user["user_id"])
    
    # Fetch all items (both income and expense)
    items = await MonthlyBudget.find(
        MonthlyBudget.user_id == user_id,
        MonthlyBudget.month == month,
        MonthlyBudget.year == year
    ).to_list()
    
    return {"items": items}

@router.post("/")
async def add_budget_item(
    payload: dict = Body(...),
    user = Depends(get_current_user)
):
    """Add a new item (Handles both Income and Expense)"""
    user_id = str(user["user_id"])
    
    # Math logic
    amount = float(payload.get("amount_per_unit", 0))
    units = int(payload.get("units", 1))
    total = amount * units
    
    budget_item = MonthlyBudget(
        user_id=user_id,
        category=payload.get("category"),
        type=payload.get("type", "expense"), # New: income or expense
        note=payload.get("note"),             # New: Optional notes
        amount_per_unit=amount,
        units=units,
        total_amount=total,
        month=int(payload.get("month")),
        year=int(payload.get("year")),
        is_completed=False
    )
    
    await budget_item.insert()
    return budget_item

@router.put("/{id}")
async def update_budget_item(
    id: str,
    payload: dict = Body(...),
    user = Depends(get_current_user)
):
    """Full update for the Edit functionality"""
    item = await MonthlyBudget.get(id)
    if not item or item.user_id != str(user["user_id"]):
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update fields
    item.category = payload.get("category", item.category)
    item.type = payload.get("type", item.type)
    item.note = payload.get("note", item.note)
    item.amount_per_unit = float(payload.get("amount_per_unit", item.amount_per_unit))
    item.units = int(payload.get("units", item.units))
    item.total_amount = item.amount_per_unit * item.units
    
    await item.save()
    return item

@router.patch("/{id}/toggle")
async def toggle_status(id: str, user = Depends(get_current_user)):
    """Toggle the checkmark status"""
    item = await MonthlyBudget.get(id)
    if not item or item.user_id != str(user["user_id"]):
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.is_completed = not item.is_completed
    await item.save()
    return item

@router.delete("/{id}")
async def delete_budget_item(id: str, user = Depends(get_current_user)):
    """Remove item from inventory"""
    item = await MonthlyBudget.get(id)
    if not item or item.user_id != str(user["user_id"]):
        raise HTTPException(status_code=404, detail="Item not found")
    
    await item.delete()
    return {"status": "success"}