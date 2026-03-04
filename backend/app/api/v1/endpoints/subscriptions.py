from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from app.utils.dependencies import get_current_user
from app.models.transaction import Transaction
from pydantic import BaseModel
from bson import ObjectId

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

class ManualSubscriptionMarker(BaseModel):
    name: str
    marked_paid_date: str

# In-memory store for manually marked bills (Since it's a new feature request, 
# storing this temporarily in memory or we could save to DB if a new collection is made)
# Note: For production, we would create a new Beanie model "SubscriptionStatus"
manual_payments_db: Dict[str, List[str]] = {}

@router.get("/")
async def get_subscriptions(
    bank: Optional[str] = Query(None),
    user = Depends(get_current_user)
):
    user_id = str(user["user_id"])
    match_stage = {"user_id": user_id, "debit": {"$gt": 0}}
    
    if bank and bank != "All Banks":
        match_stage["bank"] = {"$regex": bank, "$options": "i"}

    # Look back 6 months for robust heuristic data
    six_months_ago = datetime.now() - timedelta(days=180)
    match_stage["date"] = {"$gte": six_months_ago}

    pipeline = [
        {"$match": match_stage},
        {"$sort": {"date": 1}},
        {"$group": {
            "_id": "$payee",
            "transactions": {
                "$push": {
                    "date": "$date",
                    "amount": "$debit",
                    "id": "$_id"
                }
            },
            "count": {"$sum": 1},
            "avg_amount": {"$avg": "$debit"}
        }},
        # Only analyze payees that appear at least 3 times in 6 months
        {"$match": {"count": {"$gte": 3}}}
    ]

    collection = Transaction.get_pymongo_collection()
    cursor = collection.aggregate(pipeline)
    candidate_groups = await cursor.to_list(length=1000)

    subscriptions = []
    total_monthly_fixed = 0

    for group in candidate_groups:
        payee = group["_id"]
        txns = group["transactions"]
        
        # Calculate days between transactions
        intervals = []
        for i in range(1, len(txns)):
            days_diff = (txns[i]["date"] - txns[i-1]["date"]).days
            intervals.append(days_diff)
            
        if not intervals: continue
        
        avg_interval = sum(intervals) / len(intervals)
        
        is_subscription = False
        frequency = ""
        
        # Heuristic 1: Monthly (approx 28-31 days)
        if 26 <= avg_interval <= 35:
            is_subscription = True
            frequency = "monthly"
            
        # Heuristic 2: Weekly (approx 7 days)
        elif 6 <= avg_interval <= 8:
            is_subscription = True
            frequency = "weekly"
            
        if is_subscription:
            last_date = txns[-1]["date"]
            
            # Predict next due date
            if frequency == "monthly":
                next_due = last_date + timedelta(days=30)
            else:
                next_due = last_date + timedelta(days=7)
                
            amount = round(group["avg_amount"], 2)
            
            # Check if manually marked
            marked_dates = manual_payments_db.get(f"{user_id}_{payee}", [])
            status = "paid" if next_due.strftime("%Y-%m") in marked_dates else "pending"
            
            # If due date passed and not marked paid, mark overdue
            if next_due < datetime.now() and status != "paid":
                status = "overdue"
                
            sub_doc = {
                "id": str(txns[0]["id"]), # Use first transaction ID as a unique ref constraint
                "name": payee.title() if payee else "Unknown Subscription",
                "amount": amount,
                "frequency": frequency,
                "last_paid": last_date.strftime("%Y-%m-%d"),
                "next_due": next_due.strftime("%Y-%m-%d"),
                "status": status,
                "confidence": "High" if len(txns) >= 4 else "Medium"
            }
            
            subscriptions.append(sub_doc)
            
            if frequency == "monthly":
                total_monthly_fixed += amount
            elif frequency == "weekly":
                total_monthly_fixed += (amount * 4)

    # Calculate actual income from last 30 days for runway math
    thirty_days_ago = datetime.now() - timedelta(days=30)
    income_pipeline = [
        {"$match": {"user_id": user_id, "credit": {"$gt": 0}, "date": {"$gte": thirty_days_ago}}},
        {"$group": {"_id": None, "total_income": {"$sum": "$credit"}}}
    ]
    cursor_inc = collection.aggregate(income_pipeline)
    inc_docs = await cursor_inc.to_list(length=1)
    recent_income = inc_docs[0]["total_income"] if inc_docs else 0

    runway_pct = round((total_monthly_fixed / recent_income * 100), 1) if recent_income > 0 else 0

    return {
        "subscriptions": sorted(subscriptions, key=lambda x: x["next_due"]),
        "metrics": {
            "total_monthly_fixed": round(total_monthly_fixed, 2),
            "recent_income": round(recent_income, 2),
            "fixed_cost_ratio": runway_pct,
            "active_count": len(subscriptions)
        }
    }


@router.post("/mark-paid")
async def mark_subscription_paid(
    payload: ManualSubscriptionMarker,
    user = Depends(get_current_user)
):
    """
    Manually marks a subscription as 'paid' for a specific month (YYYY-MM).
    """
    user_id = str(user["user_id"])
    key = f"{user_id}_{payload.name.upper()}"
    
    # Store just the Year-Month strings (e.g. "2024-03")
    month_key = payload.marked_paid_date[:7] 
    
    if key not in manual_payments_db:
        manual_payments_db[key] = []
        
    if month_key not in manual_payments_db[key]:
        manual_payments_db[key].append(month_key)
        
    return {"status": "success", "message": f"{payload.name} marked as paid for {month_key}"}
