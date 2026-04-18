from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List
from bson import ObjectId
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
    banks = await Transaction.get_pymongo_collection().distinct("bank", {"user_id": user_id})
    return sorted([b for b in banks if b])


@router.post("/re-extract-payees")
async def re_extract_payees(user=Depends(get_current_user)):
    """
    Re-runs the improved payee name extractor on every transaction for this user.
    Updates `payee` and `category` fields in MongoDB without re-uploading statements.
    """
    from app.utils.normalize import extract_payee_name
    from app.utils.analysis import classify_category
    from pymongo import UpdateOne

    user_id = str(user["user_id"])
    collection = Transaction.get_pymongo_collection()

    # Fetch all transactions with their description (only what we need)
    cursor = collection.find(
        {"user_id": user_id},
        {"_id": 1, "description": 1}
    )
    docs = await cursor.to_list(length=None)

    if not docs:
        return {"updated": 0, "message": "No transactions found."}

    ops = []
    for doc in docs:
        desc = doc.get("description") or ""
        new_payee = extract_payee_name(desc)
        new_category = classify_category(new_payee)
        ops.append(
            UpdateOne(
                {"_id": doc["_id"]},
                {"$set": {"payee": new_payee, "category": new_category}}
            )
        )

    if ops:
        result = await collection.bulk_write(ops, ordered=False)
        updated = result.modified_count
    else:
        updated = 0

    return {
        "updated": updated,
        "total": len(docs),
        "message": f"Re-extracted payee names for {updated} of {len(docs)} transactions."
    }
@router.put("/{id}")
async def update_transaction(id: str, update_data: dict, user = Depends(get_current_user)):
    try:
        doc = await Transaction.get(ObjectId(id))
        if not doc or doc.user_id != str(user["user_id"]):
            raise HTTPException(status_code=404, detail="Transaction not found")
            
        allowed_keys = {"description", "payee", "category", "bank", "debit", "credit", "balance", "date"}
        update_doc = {k: v for k, v in update_data.items() if k in allowed_keys}
        
        if "date" in update_doc and isinstance(update_doc["date"], str):
           try:
               update_doc["date"] = datetime.fromisoformat(update_doc["date"].replace("Z", "+00:00"))
           except Exception:
               pass

        await doc.set(update_doc)
        return {"status": "success", "message": "Transaction updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_transaction(id: str, user = Depends(get_current_user)):
    try:
        doc = await Transaction.get(ObjectId(id))
        if not doc or doc.user_id != str(user["user_id"]):
            raise HTTPException(status_code=404, detail="Transaction not found")
            
        await doc.delete()
        return {"status": "success", "message": "Transaction deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
