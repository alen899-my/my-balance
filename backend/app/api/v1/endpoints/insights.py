from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List
from bson import ObjectId
from app.utils.dependencies import get_current_user
from app.models.transaction import Transaction
from app.models.income import IncomeEntry
from app.models.budget import BudgetEntry
from app.utils.analysis import classify_category
from app.utils.normalize import extract_payee_name
from datetime import datetime
from beanie import PydanticObjectId
import re

router = APIRouter()

@router.get("/insights")
async def get_insights(
    user = Depends(get_current_user),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    bank: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    uid_str = str(user["user_id"])
    uid = PydanticObjectId(uid_str)
    
    match_stage = {"user_id": uid_str}
    if bank and bank != "All Banks": match_stage["bank"] = {"$regex": bank, "$options": "i"}
    if search:
        fuzzy_pattern = r"\s*".join(re.escape(char) for char in search if not char.isspace())
        match_stage["$or"] = [
            {"description": {"$regex": fuzzy_pattern, "$options": "i"}},
            {"payee": {"$regex": fuzzy_pattern, "$options": "i"}}
        ]

    if start_date or end_date:
        date_filter = {}
        try:
            if start_date: date_filter["$gte"] = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            if end_date:
                dt_end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                date_filter["$lte"] = dt_end.replace(hour=23, minute=59, second=59, microsecond=999999)
            match_stage["date"] = date_filter
        except Exception: pass

    # 1. Main Transaction Pipeline
    pipeline = [
        {"$match": match_stage},
        {
            "$facet": {
                "totals": [
                    {"$group": {
                         "_id": None,
                         "income": {"$sum": {"$ifNull": ["$credit", 0]}},
                         "expense": {"$sum": {"$ifNull": ["$debit", 0]}},
                         "count": {"$sum": 1}
                    }}
                ],
                "highest_single_debit": [
                    {"$match": {"debit": {"$gt": 0}}},
                    {"$sort": {"debit": -1}}, {"$limit": 1},
                    {"$project": {"amount": "$debit", "name": "$payee", "desc": "$description"}}
                ],
                "highest_single_credit": [
                    {"$match": {"credit": {"$gt": 0}}},
                    {"$sort": {"credit": -1}}, {"$limit": 1},
                    {"$project": {"amount": "$credit", "name": "$payee", "desc": "$description"}}
                ],
                "frequent_amount": [
                    {"$match": {"debit": {"$gt": 5}}},
                    {"$group": {"_id": "$debit", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}}, {"$limit": 1}
                ],
                "debit_raw": [
                    {"$match": {"debit": {"$gt": 0}}},
                    {"$group": {"_id": "$description", "amount": {"$sum": "$debit"}, "count": {"$sum": 1}}},
                    {"$sort": {"amount": -1}}, {"$limit": 100}
                ],
                "credit_raw": [
                    {"$match": {"credit": {"$gt": 0}}},
                    {"$group": {"_id": "$description", "amount": {"$sum": "$credit"}, "count": {"$sum": 1}}},
                    {"$sort": {"amount": -1}}, {"$limit": 100}
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
                ]
            }
        }
    ]

    collection = Transaction.get_pymongo_collection()
    cursor = collection.aggregate(pipeline)
    docs = await cursor.to_list(length=1)
    res = docs[0] if docs else {}
    
    # 2. Income Module Stats
    income_col = IncomeEntry.get_pymongo_collection()
    income_pipeline = [
        {"$match": {"user_id": uid}},
        {"$group": {"_id": "$source", "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}}, {"$limit": 2}
    ]
    income_cursor = income_col.aggregate(income_pipeline)
    income_res = await income_cursor.to_list(length=2)
    top_income_source = income_res[0] if income_res else {"_id": "N/A", "total": 0}

    # 3. Refined Budget Module Stats (Prioritizing specific Titles over categories)
    budget_col = BudgetEntry.get_pymongo_collection()
    all_budget_entries = await budget_col.find({"user_id": uid, "type": "expense"}).to_list(length=1000)
    
    budget_clusters = {}
    for entry in all_budget_entries:
        # Prioritize title if it exists, fallback to category
        raw_name = entry.get("title") or entry.get("category") or "Unsorted"
        # Standardize using the same regex-engine as bank payees
        canonical = extract_payee_name(raw_name)
        month_key = f"{entry.get('month')}/{entry.get('year')}"
        
        if canonical not in budget_clusters:
            budget_clusters[canonical] = {"name": canonical, "display_name": raw_name, "total_amt": 0, "entries_count": 0, "months": set()}
        
        budget_clusters[canonical]["total_amt"] += entry.get("amount", 0)
        budget_clusters[canonical]["entries_count"] += 1
        budget_clusters[canonical]["months"].add(month_key)

    # Sort Priority: 1. Monthly Consistency, 2. Average Amount
    top_consistent_budget = sorted(
        budget_clusters.values(), 
        key=lambda x: (len(x["months"]), x["total_amt"] / x["entries_count"]), 
        reverse=True
    )[:3]
    
    top_budget_items_final = []
    for item in top_consistent_budget:
        top_budget_items_final.append({
            "name": item["display_name"], # Display the original specific title/category
            "count": len(item["months"]),
            "amount": item["total_amt"] / item["entries_count"] if item["entries_count"] > 0 else 0
        })

    # Entity Clustering for Transactions
    def cluster_entities(raw_items):
        if not raw_items: return []
        merged = {}
        for item in raw_items:
            raw_desc = item["_id"]
            canonical = extract_payee_name(raw_desc)
            if canonical in merged:
                merged[canonical]["amount"] += item["amount"]
                merged[canonical]["count"] += item["count"]
            else:
                merged[canonical] = {"_id": canonical, "amount": item["amount"], "count": item["count"], "full_desc": raw_desc}
        return sorted(merged.values(), key=lambda x: x["amount"], reverse=True)

    clustered_debits = cluster_entities(res.get("debit_raw", []))
    clustered_credits = cluster_entities(res.get("credit_raw", []))

    max_freq_entity = sorted(clustered_debits, key=lambda x: x["count"], reverse=True)[0] if clustered_debits else {}
    highest_debit = res.get("highest_single_debit", [{}])[0]
    highest_credit = res.get("highest_single_credit", [{}])[0]
    common_amt = res.get("frequent_amount", [{}])[0]

    pipeline_bal = [{"$match": match_stage}, {"$sort": {"date": -1, "_id": -1}}, {"$group": {"_id": "$bank", "balance": {"$first": "$balance"}}}]
    cursor_bal = collection.aggregate(pipeline_bal)
    bals = await cursor_bal.to_list(length=100)
    actual_balance = sum((b.get("balance") or 0) for b in bals)

    totals = res.get("totals", [{}])[0]
    
    return {
        "summary": { "income": totals.get("income", 0), "expense": totals.get("expense", 0), "balance": actual_balance, "total_transactions": totals.get("count", 0) },
        "records": {
            "highest_payment": { "amount": highest_debit.get("amount", 0), "name": highest_debit.get("name") or highest_debit.get("desc", "N/A") },
            "highest_income": { "amount": highest_credit.get("amount", 0), "name": highest_credit.get("name") or highest_credit.get("desc", "N/A") },
            "frequent_spender": { "name": max_freq_entity.get("_id", "N/A"), "count": max_freq_entity.get("count", 0) },
            "frequent_amount": { "amount": common_amt.get("_id", 0), "count": common_amt.get("count", 0) },
            "top_income_source": { "source": top_income_source.get("_id", "N/A"), "amount": top_income_source.get("total", 0) },
            "top_budget_items": top_budget_items_final
        },
        "top_debits": clustered_debits[:10],
        "top_credits": clustered_credits[:10],
        "monthly_data": [{"month": f"{m['_id']['month']}/{m['_id']['year']}", "amount": m["total"], "income": m.get("income", 0)} for m in res.get("monthly_trend", [])],
        "daily_trend": res.get("daily_trend", [])
    }

@router.get("/insights/advanced")
async def get_advanced_insights(user = Depends(get_current_user), bank: Optional[str] = Query(None)):
    try:
        user_id = str(user["user_id"])
        now = datetime.now()
        first_of_month = datetime(now.year, now.month, 1)
        match_stage = {"user_id": user_id}
        if bank and bank != "All Banks": match_stage["bank"] = {"$regex": bank, "$options": "i"}
        col = Transaction.get_pymongo_collection()
        pipeline_bal = [{"$match": match_stage}, {"$sort": {"date": -1, "_id": -1}}, {"$group": {"_id": "$bank", "balance": {"$first": "$balance"}}}]
        cursor_bal = col.aggregate(pipeline_bal)
        bals = await cursor_bal.to_list(length=100)
        current_balance = sum((b.get("balance") or 0) for b in bals)
        pipeline = [{"$match": match_stage}, {"$facet": {"current_month_stats": [{"$match": {"date": {"$gte": first_of_month}}}, {"$group": {"_id": None, "expense": {"$sum": "$debit"}, "income": {"$sum": "$credit"}}}], "historic_stats": [{"$match": {"date": {"$lt": first_of_month}}}, {"$group": {"_id": {"year": {"$year": "$date"}, "month": {"$month": "$date"}}, "monthly_total": {"$sum": "$debit"}}}, {"$sort": {"_id.year": 1, "_id.month": 1}}, {"$group": {"_id": None, "avg_monthly_burn": {"$avg": "$monthly_total"}, "history": {"$push": "$monthly_total"}}}]}}]
        cursor = col.aggregate(pipeline)
        res = await cursor.to_list(length=1)
        data = res[0] if res else {}
        cur_stats = data.get("current_month_stats", [{}])[0] if data.get("current_month_stats") else {"expense": 0, "income": 0}
        hist_stats = data.get("historic_stats", [{}])[0] if data.get("historic_stats") else {"avg_monthly_burn": 0, "history": []}
        monthly_burn = cur_stats.get("expense") or 0
        avg_burn = hist_stats.get("avg_monthly_burn") or 1
        return {"savings_rate": round(((cur_stats.get("income", 0) - monthly_burn) / (cur_stats.get("income", 1) or 1) * 100), 1), "safety_net_score": round(current_balance / avg_burn, 1), "predicted_end_balance": max(0, round(current_balance - (avg_burn/30 * (30 - now.day)), 2))}
    except Exception as e: return {"error": str(e)}