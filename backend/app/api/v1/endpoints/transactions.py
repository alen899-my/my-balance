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
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None), 
    user = Depends(get_current_user)
):
    skip = (page - 1) * limit
    
    # Build Query
    find_query = Transaction.find(Transaction.user_id == str(user["user_id"]))
    
    if search:
        # Beanie search query
        # Note: $regex queries can be slow. Ensure indexes.
        find_query = find_query.find(
            {"$or": [
                {"description": {"$regex": search, "$options": "i"}},
                {"payee": {"$regex": search, "$options": "i"}}
            ]}
        )
        
    if type == "debit":
        find_query = find_query.find(Transaction.debit > 0)
    elif type == "credit":
        find_query = find_query.find(Transaction.credit > 0)

    # Date Filter
    if start_date:
        dt_start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        find_query = find_query.find(Transaction.date >= dt_start)
    
    if end_date:
        dt_end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        find_query = find_query.find(Transaction.date <= dt_end)

    # Sort
    sort_direction = -1 if sort == "desc" else 1
    # Beanie sort syntax
    find_query = find_query.sort([("date", sort_direction), ("_id", sort_direction)])
    
    # Execute
    total_count = await find_query.count()
    transactions = await find_query.skip(skip).limit(limit).to_list()
    
    # Format for frontend (Legacy compatibility)
    data = []
    for t in transactions:
        t_dict = t.dict()
        if t.date:
            t_dict["date"] = t.date.strftime("%d %b %Y")
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
