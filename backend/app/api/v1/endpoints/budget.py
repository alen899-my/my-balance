from fastapi import APIRouter, Depends, Query, Body, HTTPException
from typing import List, Optional
from app.utils.dependencies import get_current_user
from app.models.budget import BudgetEntry, CalculationRow
from datetime import datetime
from pydantic import BaseModel

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
    month: int
    year: int

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
    return {"items": items}

from beanie import PydanticObjectId

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
        calculation_rows=payload.calculation_rows,
        month=payload.month,
        year=payload.year,
        is_completed=False
    )
    await budget_item.insert()
    return budget_item

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
    item.calculation_rows = payload.calculation_rows
    item.month = payload.month
    item.year = payload.year
    
    await item.save()
    return item

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