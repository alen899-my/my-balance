from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timedelta
from app.utils.dependencies import get_current_user
from app.models.goal import Goal
from app.models.transaction import Transaction
from pydantic import BaseModel

router = APIRouter(prefix="/goals", tags=["goals"])

class GoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0

class GoalContribution(BaseModel):
    amount: float

@router.get("/")
async def get_goals(user = Depends(get_current_user)):
    user_id = str(user["user_id"])
    goals = await Goal.find(Goal.user_id == user_id).to_list()
    
    # Calculate Savings Rate (Income - Expenses over last 30 days) to forecast ETA
    thirty_days_ago = datetime.now() - timedelta(days=30)
    
    collection = Transaction.get_pymongo_collection()
    pipeline = [
        {"$match": {"user_id": user_id, "date": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": None,
            "total_income": {"$sum": "$credit"},
            "total_expense": {"$sum": "$debit"}
        }}
    ]
    cursor = collection.aggregate(pipeline)
    stats = await cursor.to_list(length=1)
    
    monthly_savings = 0.0
    if stats:
        monthly_savings = max(0.0, stats[0].get("total_income", 0) - stats[0].get("total_expense", 0))

    # Calculate ETA for each goal
    enriched_goals = []
    for g in goals:
        remaining = max(0.0, g.target_amount - g.current_amount)
        months_to_go = -1 # Indicates never/unknown if savings <= 0
        eta_date = None
        
        if remaining == 0:
            months_to_go = 0
            eta_date = datetime.now().strftime("%b %Y")
        elif monthly_savings > 0:
            months_to_go = remaining / monthly_savings
            # Cap at 100 years to prevent absurd dates
            if months_to_go < 1200:
                future_date = datetime.now() + timedelta(days=int(months_to_go * 30))
                eta_date = future_date.strftime("%b %Y")
        
        enriched_goals.append({
            "id": str(g.id),
            "name": g.name,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "percentage": min(100.0, round((g.current_amount / g.target_amount) * 100, 1)) if g.target_amount > 0 else 0,
            "eta_date": eta_date,
            "months_to_go": round(months_to_go, 1) if months_to_go >= 0 else None,
            "monthly_savings_rate": round(monthly_savings, 2)
        })
        
    return {
        "goals": enriched_goals,
        "metrics": {
            "current_monthly_savings": round(monthly_savings, 2),
            "total_saved": sum(g.current_amount for g in goals),
            "total_target": sum(g.target_amount for g in goals)
        }
    }

@router.post("/")
async def create_goal(payload: GoalCreate, user = Depends(get_current_user)):
    user_id = str(user["user_id"])
    if payload.target_amount <= 0:
        raise HTTPException(status_code=400, detail="Target amount must be > 0")
        
    new_goal = Goal(
        user_id=user_id,
        name=payload.name,
        target_amount=payload.target_amount,
        current_amount=payload.current_amount
    )
    await new_goal.insert()
    return {"status": "success", "goal_id": str(new_goal.id)}

@router.post("/{goal_id}/add")
async def add_to_goal(goal_id: str, payload: GoalContribution, user = Depends(get_current_user)):
    user_id = str(user["user_id"])
    from bson import ObjectId
    
    goal = await Goal.get(ObjectId(goal_id))
    if not goal or goal.user_id != user_id:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Contribution must be > 0")
        
    goal.current_amount += payload.amount
    # Cap current amount at target just in case
    if goal.current_amount > goal.target_amount:
        goal.current_amount = goal.target_amount
        
    await goal.save()
    return {"status": "success", "new_amount": goal.current_amount}
