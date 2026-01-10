from fastapi import APIRouter, Depends, Query
from typing import Optional
from bson import ObjectId
from app.utils.dependencies import get_current_user
from app.models.transaction import Transaction
from app.utils.analysis import classify_category, extract_clean_name
from datetime import datetime

import re
router = APIRouter()

def extract_clean_name(payee_str: str) -> str:
    """
    Cleans UPI strings like 'UPI-NAME-NAME@okaxis' or 'TRANSFER TO NAME' 
    into a readable name or UPI ID.
    """
    if not payee_str:
        return "Unknown"
    
    # Heuristic: If it contains '@', it's a UPI ID. Extract the ID.
    upi_match = re.search(r'[\w\.-]+@[\w\.-]+', payee_str)
    if upi_match:
        return upi_match.group(0).lower()
    
    # Remove common banking prefixes
    clean = re.sub(r'(UPI-|TRANSFER TO |PAYMENT FROM |/|INB |RTGS |NEFT )', '', payee_str, flags=re.IGNORECASE)
    return clean.strip().title()

@router.get("/insights")
async def get_insights(
    user = Depends(get_current_user),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    user_id = str(user["user_id"])
    
    match_stage = {"user_id": user_id}
    
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        if end_date:
            date_filter["$lte"] = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        match_stage["date"] = date_filter

    pipeline = [
        {"$match": match_stage},
        {
            "$facet": {
                "totals": [
                    {"$group": {
                        "_id": None,
                        "income": {"$sum": "$credit"},
                        "expense": {"$sum": "$debit"},
                        "count": {"$sum": 1},
                        "avg_txn": {"$avg": {"$cond": [{"$gt": ["$debit", 0]}, "$debit", None]}}
                    }}
                ],
                "payee_leaderboard": [
                    {
                        # We group by the raw payee first
                        "$group": {
                            "_id": "$payee",
                            "total_spent": {"$sum": "$debit"},
                            "total_received": {"$sum": "$credit"},
                            "txn_count": {"$sum": 1}
                        }
                    }
                ],
                "daily_trend": [
                    {"$group": {"_id": "$date", "daily_spend": {"$sum": "$debit"}}},
                    {"$group": {"_id": None, "avg_daily": {"$avg": "$daily_spend"}}}
                ],
                "monthly_trend": [
                    {"$group": {
                        "_id": { "month": {"$month": "$date"}, "year": {"$year": "$date"} },
                        "total": {"$sum": "$debit"}
                    }},
                    {"$sort": {"_id.year": 1, "_id.month": 1}}
                ],
                "category_spending": [
                    {"$group": {"_id": "$category", "total": {"$sum": "$debit"}}}
                ],
                "latest_balance": [
                    {"$sort": {"date": -1, "_id": -1}},
                    {"$limit": 1},
                    {"$project": {"balance": 1}}
                ]
            }
        }
    ]

    collection = Transaction.get_pymongo_collection()
    cursor = collection.aggregate(pipeline)
    docs = await cursor.to_list(length=1)
    res = docs[0] if docs else {}

    # --- NEW MERGING LOGIC ---
    # This dictionary will store cleaned names as keys to combine totals
    merged_leaderboard = {}

    for p in res.get("payee_leaderboard", []):
        raw_name = p["_id"] or "Unknown"
        clean_name = extract_clean_name(raw_name)
        
        # If the clean_name is just "Upi Transfer", we try to skip it or 
        # let it be, but the merge ensures it doesn't duplicate.
        if clean_name in merged_leaderboard:
            merged_leaderboard[clean_name]["spent"] += p["total_spent"]
            merged_leaderboard[clean_name]["received"] += p["total_received"]
            merged_leaderboard[clean_name]["count"] += p["txn_count"]
        else:
            merged_leaderboard[clean_name] = {
                "name": clean_name,
                "spent": p["total_spent"],
                "received": p["total_received"],
                "count": p["txn_count"]
            }

    # Convert dictionary back to list and sort by spent
    leaderboard = sorted(
        merged_leaderboard.values(), 
        key=lambda x: x["spent"], 
        reverse=True
    )

    # Extraction for summary
    latest_bal_list = res.get("latest_balance", [])
    actual_balance = latest_bal_list[0].get("balance", 0) if latest_bal_list else 0
    totals_list = res.get("totals", [])
    summary_data = totals_list[0] if totals_list else {}
    daily_trend_list = res.get("daily_trend", [])
    daily_avg = daily_trend_list[0].get("avg_daily", 0) if daily_trend_list else 0

    income = summary_data.get("income", 0) or 0
    expense = summary_data.get("expense", 0) or 0
    avg_txn = summary_data.get("avg_txn", 0) or 0

    return {
        "summary": {
            "income": income,
            "expense": expense,
            "balance": actual_balance,
            "savings_rate": round(((income - expense) / income * 100), 2) if income > 0 else 0,
            "total_transactions": summary_data.get("count", 0) or 0,
            "daily_avg": round(daily_avg, 2),
            "avg_transaction": round(avg_txn, 2)
        },
        "leaderboard": leaderboard, # Send full list so frontend can filter Inflow vs Outflow
        "monthly_data": [
            {"month": f"{m['_id']['month']}/{m['_id']['year']}", "amount": m["total"]} 
            for m in res.get("monthly_trend", [])
        ],
        "category_data": sorted([
            {"category": item["_id"] or "Uncategorized", "amount": item["total"]}
            for item in res.get("category_spending", [])
            if item["total"] > 0
        ], key=lambda x: x['amount'], reverse=True)
    }


@router.get("/insights/advanced")
async def get_advanced_insights(user = Depends(get_current_user)):
    user_id = str(user["user_id"])
    now = datetime.now()
    first_of_month = datetime(now.year, now.month, 1)
    
    # 1. Get Latest Balance
    latest_txn = await Transaction.find(Transaction.user_id == user_id).sort("-date", "-_id").limit(1).to_list()
    current_balance = latest_txn[0].balance if latest_txn else 0

    # 2. Comprehensive Aggregation Pipeline
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$facet": {
            "current_month_stats": [
                {"$match": {"date": {"$gte": first_of_month}}},
                {"$group": {
                    "_id": None,
                    "expense": {"$sum": "$debit"},
                    "income": {"$sum": "$credit"},
                    "weekend_expense": {
                        "$sum": {"$cond": [{"$in": [{"$dayOfWeek": "$date"}, [1, 7]]}, "$debit", 0]}
                    }
                }}
            ],
            "historic_stats": [
                {"$match": {"debit": {"$gt": 0}}},
                {"$group": {
                    "_id": {"year": {"$year": "$date"}, "month": {"$month": "$date"}},
                    "monthly_total": {"$sum": "$debit"}
                }},
                {"$sort": {"_id.year": 1, "_id.month": 1}},
                {"$group": {
                    "_id": None,
                    "avg_monthly_burn": {"$avg": "$monthly_total"},
                    "history": {"$push": "$monthly_total"}
                }}
            ]
        }}
    ]

    col = Transaction.get_pymongo_collection()
    cursor = col.aggregate(pipeline)
    res = await cursor.to_list(length=1)
    
    data = res[0] if res else {}

    # Extract results safely
    cur_stats = data.get("current_month_stats", [{}])[0] if data.get("current_month_stats") else {"expense": 0, "income": 0, "weekend_expense": 0}
    hist_stats = data.get("historic_stats", [{}])[0] if data.get("historic_stats") else {"avg_monthly_burn": 0, "history": []}

    # Calculations
    monthly_burn = cur_stats.get("expense") or 0
    monthly_income = cur_stats.get("income") or 0
    avg_burn = hist_stats.get("avg_monthly_burn") or (monthly_burn if monthly_burn > 0 else 1)
    
    # Savings Rate
    savings_rate = round(((monthly_income - monthly_burn) / monthly_income * 100), 1) if monthly_income > 0 else 0

    # Lifestyle Inflation (Current month vs average of previous months)
    history = hist_stats.get("history", [])
    lifestyle_inflation = 0
    if len(history) >= 2:
        prev_month = history[-2]
        if prev_month > 0:
            lifestyle_inflation = round(((monthly_burn - prev_month) / prev_month) * 100, 1)

    # Burn Variance (Current month vs Historical Average)
    burn_variance = round(((monthly_burn - avg_burn) / avg_burn) * 100, 1) if avg_burn > 0 else 0

    # Weekend Intensity
    weekend_intensity = round((cur_stats.get("weekend_expense", 0) / monthly_burn * 100), 1) if monthly_burn > 0 else 0

    # Prediction Logic
    days_passed = now.day
    days_in_month = 30 # Simplified
    daily_burn_avg = avg_burn / days_in_month
    predicted_end = current_balance - (daily_burn_avg * (days_in_month - days_passed))

    return {
        "savings_rate": savings_rate,
        "safety_net_score": round(current_balance / avg_burn, 1) if avg_burn > 0 else 0,
        "lifestyle_inflation": lifestyle_inflation,
        "burn_variance": burn_variance,
        "weekend_intensity": weekend_intensity,
        "recurring_total": round(monthly_burn * 0.4, 2), # Heuristic
        "payday_velocity": "High" if (monthly_burn > avg_burn * 0.5 and days_passed < 10) else "Normal",
        "predicted_end_balance": max(0, round(predicted_end, 2))
    }