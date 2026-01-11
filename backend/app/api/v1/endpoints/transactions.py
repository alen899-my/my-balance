from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List
from app.utils.dependencies import get_current_user
from app.models.transaction import Transaction
from app.db.session import init_db
from datetime import datetime

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("")
async def get_transactions(
    page: int = 1, 
    limit: int = 20, 
    search: Optional[str] = None,
    type: str = "all", 
    sort: str = "desc",
    bank: Optional[str] = Query(None), # NEW: Added bank filter parameter
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None), 
    user = Depends(get_current_user)
):
    skip = (page - 1) * limit
    
    # 1. Base Query: Always filter by user
    find_query = Transaction.find(Transaction.user_id == str(user["user_id"]))
    
    # 2. NEW: Bank Filtering Logic
    if bank and bank != "All Banks":
        # We use a case-insensitive check to match "FEDERAL" or "Federal Bank"
        find_query = find_query.find({"bank": {"$regex": bank, "$options": "i"}})

    # 3. Search Logic
    if search:
        find_query = find_query.find(
            {"$or": [
                {"description": {"$regex": search, "$options": "i"}},
                {"payee": {"$regex": search, "$options": "i"}}
            ]}
        )
        
    # 4. Transaction Type Filter
    if type == "debit":
        find_query = find_query.find(Transaction.debit > 0)
    elif type == "credit":
        find_query = find_query.find(Transaction.credit > 0)

    # 5. Date Filter
    if start_date:
        dt_start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        find_query = find_query.find(Transaction.date >= dt_start)
    
    if end_date:
        dt_end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        dt_end = dt_end.replace(hour=23, minute=59, second=59, microsecond=999999)
        find_query = find_query.find(Transaction.date <= dt_end)

    # 6. Sorting
    sort_direction = -1 if sort == "desc" else 1
    find_query = find_query.sort([("date", sort_direction), ("_id", sort_direction)])
    
    # 7. Execution
    total_count = await find_query.count()
    transactions = await find_query.skip(skip).limit(limit).to_list()
    
    # 8. Formatting for Frontend
    data = []
    for t in transactions:
        t_dict = t.dict()
        if t.date:
            t_dict["date"] = t.date.strftime("%d %b %Y")
        # Ensure ID is string for frontend
        if "_id" in t_dict: t_dict["_id"] = str(t_dict["_id"])
        data.append(t_dict)
    
    return {
        "data": data,
        "total": total_count,
        "totalPages": (total_count + limit - 1) // limit
    }

@router.delete("/clear")
async def clear_all_transactions(user = Depends(get_current_user)):
    try:
        await Transaction.find(Transaction.user_id == str(user["user_id"])).delete()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/unique-banks")
async def get_unique_banks(user = Depends(get_current_user)):
    user_id = str(user["user_id"])
    # Get unique bank names from the transactions collection for this user
    banks = await Transaction.get_pymongo_collection().distinct("bank", {"user_id": user_id})
    return sorted([b for b in banks if b])