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
    
    # Date Filtering
    if start_date or end_date:
        match_stage["date"] = {}
        if start_date:
            try:
                match_stage["date"]["$gte"] = datetime.strptime(start_date, "%Y-%m-%d")
            except: pass
        if end_date:
            try:
                match_stage["date"]["$lte"] = datetime.strptime(end_date, "%Y-%m-%d")
            except: pass

    if search:
        fuzzy_pattern = r"\s*".join(re.escape(char) for char in search if not char.isspace())
        match_stage["$or"] = [
            {"description": {"$regex": fuzzy_pattern, "$options": "i"}},
            {"payee": {"$regex": fuzzy_pattern, "$options": "i"}}
        ]

    tx_col = Transaction.get_pymongo_collection()
    pipeline = [{"$match": match_stage}, {"$facet": {"totals": [{"$group": {"_id": None, "income": {"$sum": {"$ifNull": ["$credit", 0]}}, "expense": {"$sum": {"$ifNull": ["$debit", 0]}}, "count": {"$sum": 1}}}], "highest_single_debit": [{"$match": {"debit": {"$gt": 0}}}, {"$sort": {"debit": -1}}, {"$limit": 1}], "highest_single_credit": [{"$match": {"credit": {"$gt": 0}}}, {"$sort": {"credit": -1}}, {"$limit": 1}], "frequent_amount": [{"$match": {"debit": {"$gt": 5}}}, {"$group": {"_id": "$debit", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}, {"$limit": 1}], "debit_raw": [{"$match": {"debit": {"$gt": 0}}}, {"$group": {"_id": "$description", "amount": {"$sum": "$debit"}, "count": {"$sum": 1}}}, {"$sort": {"amount": -1}}, {"$limit": 100}], "credit_raw": [{"$match": {"credit": {"$gt": 0}}}, {"$group": {"_id": "$description", "amount": {"$sum": "$credit"}, "count": {"$sum": 1}}}, {"$sort": {"amount": -1}}, {"$limit": 100}], "daily_trend": [{"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}}, "daily_spend": {"$sum": {"$ifNull": ["$debit", 0]}}}}, {"$sort": {"_id": 1}}], "monthly_trend": [{"$group": {"_id": {"month": {"$month": "$date"}, "year": {"$year": "$date"}}, "total": {"$sum": {"$ifNull": ["$debit", 0]}}, "income": {"$sum": {"$ifNull": ["$credit", 0]}}}}, {"$sort": {"_id.year": 1, "_id.month": 1}}]}}]
    cursor = tx_col.aggregate(pipeline)
    docs = await cursor.to_list(length=1)
    res = docs[0] if docs else {}
    
    # 2. Income Stats
    income_col = IncomeEntry.get_pymongo_collection()
    income_pipeline = [
        {"$match": {"user_id": uid}},
        {"$group": {"_id": "$source", "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}}, {"$limit": 1}
    ]
    income_cursor = income_col.aggregate(income_pipeline)
    income_res = await income_cursor.to_list(length=1)
    top_income_source = income_res[0] if income_res else {"_id": "N/A", "total": 0}

    # 3. Budget Module Stats
    # Combine start/end dates into month/year ranges for BudgetEntry
    budget_query = {"$or": [{"user_id": uid}, {"user_id": uid_str}]}
    
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d")
            # We want months >= sd.month AND years >= sd.year (complex in mongo, easier to filter in python or use a sort_val)
            # Actually, let's just fetch and filter in memory since budget entries are few
            pass 
        except: pass

    all_budget_entries = await BudgetEntry.find(budget_query).to_list()
    
    # Filter in memory for precise control
    if start_date or end_date:
        filtered = []
        try:
            s_dt = datetime.strptime(start_date, "%Y-%m-%d") if start_date else datetime.min
            e_dt = datetime.strptime(end_date, "%Y-%m-%d") if end_date else datetime.max
            
            for entry in all_budget_entries:
                # Create a date object for the entry (1st of month)
                entry_dt = datetime(entry.year, entry.month, 1)
                if s_dt <= entry_dt <= e_dt:
                    filtered.append(entry)
            all_budget_entries = filtered
        except: pass
    
    budget_clusters = {}
    budget_monthly_comp = {}

    for entry in all_budget_entries:
        try:
            # Safely extract values from Beanie model
            month = int(entry.month or datetime.now().month)
            year = int(entry.year or datetime.now().year)
            amount = float(entry.amount or 0)
            etype = str(entry.type or "expense").lower()
            title = str(entry.title or entry.category or "Unsorted")
            
            month_key = f"{month}/{year}"
            
            if etype == "expense":
                canonical = extract_payee_name(title)
                if canonical not in budget_clusters:
                    budget_clusters[canonical] = {"name": canonical, "display_name": title, "total_amt": 0, "count": 0, "months": set()}
                budget_clusters[canonical]["total_amt"] += amount
                budget_clusters[canonical]["count"] += 1
                budget_clusters[canonical]["months"].add(month_key)

            if month_key not in budget_monthly_comp:
                budget_monthly_comp[month_key] = {"month": month_key, "income": 0, "need": 0, "sort_val": year * 100 + month}
            
            if etype == "income": 
                budget_monthly_comp[month_key]["income"] += amount
            else: 
                budget_monthly_comp[month_key]["need"] += amount
        except Exception as e:
            print(f"Error processing budget entry: {e}")
            continue

    top_consistent_budget = sorted(budget_clusters.values(), key=lambda x: (len(x["months"]), x["total_amt"] / (x["count"] or 1)), reverse=True)[:3]
    top_budget_items_final = [{"name": item["display_name"], "count": len(item["months"]), "amount": item["total_amt"] / (item["count"] or 1)} for item in top_consistent_budget]
    budget_trend = sorted(budget_monthly_comp.values(), key=lambda x: x["sort_val"])

    # Transaction Clustering logic
    def cluster_entities(raw_items):
        if not raw_items: return []
        merged = {}
        for item in raw_items:
            canonical = extract_payee_name(item["_id"])
            if canonical in merged:
                merged[canonical]["amount"] += item["amount"]
                merged[canonical]["count"] += item["count"]
            else: merged[canonical] = {"_id": canonical, "amount": item["amount"], "count": item["count"]}
        return sorted(merged.values(), key=lambda x: x["amount"], reverse=True)

    clustered_debits = cluster_entities(res.get("debit_raw", []))
    clustered_credits = cluster_entities(res.get("credit_raw", []))
    max_freq_entity = sorted(clustered_debits, key=lambda x: x["count"], reverse=True)[0] if clustered_debits else {}
    highest_debit = res.get("highest_single_debit", [{}])[0]
    highest_credit = res.get("highest_single_credit", [{}])[0]
    common_amt = res.get("frequent_amount", [{}])[0]

    return {
        "summary": { "income": res.get("totals", [{}])[0].get("income", 0), "expense": res.get("totals", [{}])[0].get("expense", 0), "total_transactions": res.get("totals", [{}])[0].get("count", 0) },
        "records": {
            "highest_payment": { "amount": highest_debit.get("debit", 0), "name": highest_debit.get("payee") or highest_debit.get("description", "N/A") },
            "highest_income": { "amount": highest_credit.get("credit", 0), "name": highest_credit.get("payee") or highest_credit.get("description", "N/A") },
            "frequent_spender": { "name": max_freq_entity.get("_id", "N/A"), "count": max_freq_entity.get("count", 0) },
            "frequent_amount": { "amount": common_amt.get("_id", 0), "count": common_amt.get("count", 0) },
            "top_income_source": { "source": top_income_source.get("_id", "N/A"), "amount": top_income_source.get("total", 0) },
            "top_budget_items": top_budget_items_final,
            "budget_trend": budget_trend
        },
        "top_debits": clustered_debits[:10],
        "top_credits": clustered_credits[:10],
        "monthly_data": [{"month": f"{m['_id']['month']}/{m['_id']['year']}", "amount": m["total"], "income": m.get("income", 0)} for m in res.get("monthly_trend", [])],
        "daily_trend": res.get("daily_trend", [])
    }