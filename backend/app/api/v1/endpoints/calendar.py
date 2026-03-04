from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
import calendar
from app.utils.dependencies import get_current_user
from app.models.calendar import CalendarNeed
from app.models.transaction import Transaction
from pydantic import BaseModel
from bson import ObjectId

router = APIRouter(prefix="/calendar", tags=["calendar"])

class NeedCreate(BaseModel):
    name: str
    amount: float
    date: str  # YYYY-MM-DD

class NeedUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    is_paid: Optional[bool] = None

@router.get("/summary")
async def get_calendar_summary(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    user = Depends(get_current_user)
):
    user_id = str(user["user_id"])
    
    # Calculate date range for the month
    start_date = datetime(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = datetime(year, month, last_day, 23, 59, 59)
    
    # 1. Aggregate Transactions by Day
    txn_collection = Transaction.get_pymongo_collection()
    pipeline = [
        {"$match": {
            "user_id": user_id,
            "date": {"$gte": start_date, "$lte": end_date}
        }},
        {"$group": {
            "_id": {"$dayOfMonth": "$date"},
            "total_spent": {"$sum": "$debit"},
            "total_earned": {"$sum": "$credit"}
        }}
    ]
    cursor = txn_collection.aggregate(pipeline)
    daily_stats = await cursor.to_list(length=31)
    
    # 2. Fetch Needs for the month
    needs = await CalendarNeed.find(
        CalendarNeed.user_id == user_id,
        CalendarNeed.date >= start_date,
        CalendarNeed.date <= end_date
    ).to_list()
    
    # Format needs for frontend
    formatted_needs = []
    for n in needs:
        formatted_needs.append({
            "id": str(n.id),
            "name": n.name,
            "amount": n.amount,
            "date": n.date.strftime("%Y-%m-%d"),
            "is_paid": n.is_paid
        })
    
    # Create daily spent map
    spent_map = {item["_id"]: item["total_spent"] for item in daily_stats}
    
    return {
        "month": month,
        "year": year,
        "daily_spending": spent_map,
        "needs": formatted_needs
    }

@router.post("/needs")
async def create_need(payload: NeedCreate, user = Depends(get_current_user)):
    user_id = str(user["user_id"])
    try:
        due_date = datetime.strptime(payload.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    new_need = CalendarNeed(
        user_id=user_id,
        name=payload.name,
        amount=payload.amount,
        date=due_date
    )
    await new_need.insert()
    return {"status": "success", "id": str(new_need.id)}

@router.patch("/needs/{need_id}")
async def update_need(need_id: str, payload: NeedUpdate, user = Depends(get_current_user)):
    user_id = str(user["user_id"])
    need = await CalendarNeed.get(ObjectId(need_id))
    
    if not need or need.user_id != user_id:
        raise HTTPException(status_code=404, detail="Need not found")
        
    if payload.name is not None: need.name = payload.name
    if payload.amount is not None: need.amount = payload.amount
    if payload.is_paid is not None: need.is_paid = payload.is_paid
    if payload.date is not None:
        try:
            need.date = datetime.strptime(payload.date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
            
    await need.save()
    return {"status": "success"}

@router.delete("/needs/{need_id}")
async def delete_need(need_id: str, user = Depends(get_current_user)):
    user_id = str(user["user_id"])
    need = await CalendarNeed.get(ObjectId(need_id))
    
    if not need or need.user_id != user_id:
        raise HTTPException(status_code=404, detail="Need not found")
        
    await need.delete()
    return {"status": "success"}
