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
    Cleans messy bank transaction narrative strings into readable names or UPI IDs.
    """
    if not payee_str:
        return "Unknown"
        
    p = payee_str.upper()
    
    # Heuristic 1: Extract VPA / UPI ID if present
    upi_match = re.search(r'([A-Z0-9\.\-_]+@[A-Z]+)', p)
    if upi_match:
        return upi_match.group(1).lower()

    # Heuristic 2: Standard bank slash formats (e.g., UPI/12345/John Doe/SBI)
    slash_parts = p.split('/')
    if len(slash_parts) >= 3 and any(x in p for x in ['UPI', 'IMPS', 'NEFT', 'RTGS']):
        candidate = slash_parts[2].strip()
        if len(candidate) > 2:
            return candidate.title()

    # Heuristic 3: Common hyphen format (e.g., UPI-John Doe)
    if "UPI-" in p:
        parts = p.split("-")
        if len(parts) >= 2 and len(parts[1]) > 2:
            return parts[1].strip().title()

    # Heuristic 4: Strip banking acronyms and stop words
    # Remove things like UPIAR, INB, POS, DR, CR, HDFC, etc.
    p = re.sub(r'\b(UPIAR|UPI|TRANSFER TO|PAYMENT FROM|INB|RTGS|NEFT|IMPS|POS|DR|CR|HDFC|SBI|ICICI|AXIS)\b|/|-', ' ', p)
    
    # Collapse multiple spaces
    p = " ".join(p.split())
    
    if len(p) <= 2:
        # If we aggressively stripped everything, fallback safely
        return payee_str.title()[:20].strip()
        
    return p.title()[:25]

@router.get("/insights")
async def get_insights(
    user = Depends(get_current_user),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    bank: Optional[str] = Query(None)
):
    user_id = str(user["user_id"])
    match_stage = {"user_id": user_id}

    # 1. Bank Filter
    if bank and bank != "All Banks":
        match_stage["bank"] = {"$regex": bank, "$options": "i"}

    # 2. Date Filter with Safety
    if start_date or end_date:
        date_filter = {}
        try:
            if start_date:
                date_filter["$gte"] = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            if end_date:
                dt_end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                date_filter["$lte"] = dt_end.replace(hour=23, minute=59, second=59, microsecond=999999)
            match_stage["date"] = date_filter
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")

    pipeline = [
        {"$match": match_stage},
        {
            "$facet": {
                "totals": [
                    {"$group": {
                        "_id": None,
                        "income": {"$sum": {"$ifNull": ["$credit", 0]}}, # Safety check
                        "expense": {"$sum": {"$ifNull": ["$debit", 0]}},  # Safety check
                        "count": {"$sum": 1},
                        "avg_txn": {"$avg": {"$cond": [{"$gt": ["$debit", 0]}, "$debit", None]}}
                    }}
                ],
                "payee_leaderboard": [
                    {"$group": {
                        "_id": "$payee",
                        "total_spent": {"$sum": {"$ifNull": ["$debit", 0]}},
                        "total_received": {"$sum": {"$ifNull": ["$credit", 0]}},
                        "txn_count": {"$sum": 1}
                    }},
                    {"$addFields": {"activity": {"$add": ["$total_spent", "$total_received"]}}},
                    {"$sort": {"activity": -1}},
                    {"$limit": 500}
                ],
                "daily_trend": [
                    {"$group": {
                        "_id": { "$dateToString": {"format": "%Y-%m-%d", "date": "$date"} }, 
                        "daily_spend": {"$sum": {"$ifNull": ["$debit", 0]}}
                    }},
                    {"$sort": {"_id": 1}}
                ],
                "monthly_trend": [
                    {"$group": {
                        "_id": { "month": {"$month": "$date"}, "year": {"$year": "$date"} },
                        "total": {"$sum": {"$ifNull": ["$debit", 0]}},
                        "income": {"$sum": {"$ifNull": ["$credit", 0]}}
                    }},
                    {"$sort": {"_id.year": 1, "_id.month": 1}}
                ],
                "day_of_week_trend": [
                    {"$group": {
                        "_id": {"$dayOfWeek": "$date"},
                        "expense": {"$sum": {"$ifNull": ["$debit", 0]}}
                    }},
                    {"$sort": {"_id": 1}}
                ],
                "category_spending": [
                    {"$group": {"_id": {"$ifNull": ["$category", "Uncategorized"]}, "total": {"$sum": {"$ifNull": ["$debit", 0]}}}}
                ]
            }
        }
    ]

    collection = Transaction.get_pymongo_collection()
    cursor = collection.aggregate(pipeline)
    docs = await cursor.to_list(length=1)
    res = docs[0] if docs else {}
    
    # Calculate actual true balance (sum of latest balance per bank)
    pipeline_bal = [
        {"$match": match_stage},
        {"$sort": {"date": -1, "_id": -1}},
        {"$group": {"_id": "$bank", "balance": {"$first": "$balance"}}}
    ]
    cursor_bal = collection.aggregate(pipeline_bal)
    bals = await cursor_bal.to_list(length=100)
    actual_balance = sum((b.get("balance") or 0) for b in bals)

    # --- MERGING LOGIC ---
    merged_leaderboard = {}
    for p in res.get("payee_leaderboard", []):
        raw_name = p["_id"] or "Unknown"
        clean_name = extract_clean_name(raw_name)
        
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

    leaderboard = sorted(merged_leaderboard.values(), key=lambda x: x["spent"], reverse=True)

    # 3. Safe Extraction (Prevents IndexError)
    totals_list = res.get("totals", [])
    summary_data = totals_list[0] if totals_list else {}
    
    daily_trend_list = res.get("daily_trend", [])
    if daily_trend_list:
        daily_avg = sum(d.get("daily_spend", 0) for d in daily_trend_list) / len(daily_trend_list)
    else:
        daily_avg = 0

    income = summary_data.get("income", 0) or 0
    expense = summary_data.get("expense", 0) or 0
    avg_txn = summary_data.get("avg_txn", 0) or 0

    day_mapping = {1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat"}
    return {
        "summary": {
            "income": income,
            "expense": expense,
            "balance": actual_balance,
            "savings_rate": round(((income - expense) / income * 100), 2) if income > 0 else 0,
            "total_transactions": summary_data.get("count", 0) or 0,
            "daily_avg": round(daily_avg, 2),
            "avg_transaction": round(avg_txn, 2),
            "daily_trend": daily_trend_list
        },
        "leaderboard": leaderboard,
        "monthly_data": [
            {
                "month": f"{m['_id']['month']}/{m['_id']['year']}", 
                "amount": m["total"],
                "expense": m["total"],
                "income": m.get("income", 0)
            } 
            for m in res.get("monthly_trend", [])
        ],
        "day_of_week_data": [
            {"day": day_mapping.get(m["_id"], "Unknown"), "amount": m["expense"]}
            for m in res.get("day_of_week_trend", [])
        ],
        "category_data": sorted([
            {"category": item["_id"], "amount": item["total"]}
            for item in res.get("category_spending", [])
            if item["total"] > 0
        ], key=lambda x: x['amount'], reverse=True)
    }

@router.get("/insights/advanced")
async def get_advanced_insights(
    user = Depends(get_current_user),
    bank: Optional[str] = Query(None)
):
    try:
        user_id = str(user["user_id"])
        now = datetime.now()
        first_of_month = datetime(now.year, now.month, 1)
        
        match_stage = {"user_id": user_id}
        if bank and bank != "All Banks":
            match_stage["bank"] = {"$regex": bank, "$options": "i"}
            
        col = Transaction.get_pymongo_collection()

        pipeline_bal = [
            {"$match": match_stage},
            {"$sort": {"date": -1, "_id": -1}},
            {"$group": {"_id": "$bank", "balance": {"$first": "$balance"}}}
        ]
        cursor_bal = col.aggregate(pipeline_bal)
        bals = await cursor_bal.to_list(length=100)
        current_balance = sum((b.get("balance") or 0) for b in bals)

        pipeline = [
            {"$match": match_stage},
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
                    {"$match": {"date": {"$lt": first_of_month}}},
                    {"$group": {
                        "_id": {"year": {"$year": "$date"}, "month": {"$month": "$date"}},
                        "monthly_total": {"$sum": "$debit"},
                        "monthly_income": {"$sum": "$credit"},
                        "txn_count": {"$sum": 1}
                    }},
                    {"$sort": {"_id.year": 1, "_id.month": 1}},
                    {"$group": {
                        "_id": None,
                        "avg_monthly_burn": {"$avg": "$monthly_total"},
                        "avg_monthly_income": {"$avg": "$monthly_income"},
                        "max_income": {"$max": "$monthly_income"},
                        "min_income": {"$min": "$monthly_income"},
                        "avg_monthly_txns": {"$avg": "$txn_count"},
                        "history": {"$push": "$monthly_total"},
                        "income_history": {"$push": "$monthly_income"}
                    }}
                ]
            }}
        ]

        cursor = col.aggregate(pipeline)
        res = await cursor.to_list(length=1)
        
        data = res[0] if res else {}

        cur_stats = data.get("current_month_stats", [{}])[0] if data.get("current_month_stats") else {"expense": 0, "income": 0, "weekend_expense": 0}
        hist_stats = data.get("historic_stats", [{}])[0] if data.get("historic_stats") else {"avg_monthly_burn": 0, "history": []}

        monthly_burn = cur_stats.get("expense") or 0
        monthly_income = cur_stats.get("income") or 0
        avg_burn = hist_stats.get("avg_monthly_burn") or (monthly_burn if monthly_burn > 0 else 1)
        avg_income = hist_stats.get("avg_monthly_income") or (monthly_income if monthly_income > 0 else 1)
        
        history = hist_stats.get("history", [])
        
        # Use last completed month for variance/inflation to prevent mid-month skew
        last_full_month_burn = history[-1] if len(history) >= 1 else monthly_burn
        
        # Savings Rate uses historical average income if current month is too young, or defaults
        savings_rate = 0
        if monthly_income > 0:
            savings_rate = round(((monthly_income - monthly_burn) / monthly_income * 100), 1)
        elif avg_income > 0:
            savings_rate = round(((avg_income - avg_burn) / avg_income * 100), 1)
        
        lifestyle_inflation = 0
        if len(history) >= 2:
            last_month = history[-1]
            prev_month = history[-2]
            if prev_month > 0:
                lifestyle_inflation = round(((last_month - prev_month) / prev_month) * 100, 1)

        burn_variance = 0
        if avg_burn > 0:
            burn_variance = round(((last_full_month_burn - avg_burn) / avg_burn) * 100, 1)

        weekend_intensity = round((cur_stats.get("weekend_expense", 0) / (monthly_burn or 1) * 100), 1)

        days_passed = now.day
        days_in_month = 30 # Simplified
        daily_burn_avg = avg_burn / days_in_month
        predicted_end = current_balance - (daily_burn_avg * (days_in_month - days_passed))

        recurring_total = round(last_full_month_burn * 0.4, 2)
        
        # Dynamic DTI (Debt-to-Income) Ratio estimation based on recurring vs avg income
        dti_ratio = round(recurring_total / avg_income, 2) if avg_income > 0 else 0
        
        # Dynamic Financial Age based on Balance to Avg Burn ratio (Safety Net Score) mapped to an age heuristic
        safety_net_score = round(current_balance / avg_burn, 1) if avg_burn > 0 else 0
        financial_age = int(18 + (safety_net_score * 1.5))

        # Income Volatility (Max variance in historical income)
        max_inc = hist_stats.get("max_income", 0)
        min_inc = hist_stats.get("min_income", 0)
        income_volatility = round(((max_inc - min_inc) / avg_income) * 100, 1) if avg_income > 0 else 0

        # TXN frequency
        avg_txns = hist_stats.get("avg_monthly_txns", 0)
        tx_frequency = round(avg_txns / 30, 1) if avg_txns > 0 else 0

        if savings_rate >= 20:
            savings_status = "Excellent"
        elif savings_rate >= 10:
            savings_status = "Stable"
        elif savings_rate >= 0:
            savings_status = "At Risk"
        else:
            savings_status = "Deficit"

        return {
            "savings_rate": savings_rate,
            "safety_net_score": safety_net_score,
            "lifestyle_inflation": lifestyle_inflation,
            "burn_variance": burn_variance,
            "weekend_intensity": weekend_intensity,
            "recurring_total": recurring_total, # Heuristic based on full month
            "payday_velocity": "High" if (monthly_burn > avg_burn * 0.5 and days_passed < 10) else "Normal",
            "predicted_end_balance": max(0, round(predicted_end, 2)),
            "dti_ratio": dti_ratio,
            "financial_age": f"{financial_age} yrs",
            "income_volatility": income_volatility,
            "tx_frequency": tx_frequency,
            "savings_status": savings_status
        }
    except Exception as e:
        import traceback
        return {
            "error_traceback": traceback.format_exc(),
            "savings_rate": 0,
            "safety_net_score": 0,
            "lifestyle_inflation": 0,
            "burn_variance": 0,
            "weekend_intensity": 0,
            "recurring_total": 0,
            "payday_velocity": "Error",
            "predicted_end_balance": 0,
            "dti_ratio": 0,
            "financial_age": "Unknown",
            "income_volatility": 0,
            "tx_frequency": 0,
            "savings_status": "Unknown"
        }