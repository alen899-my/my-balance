from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List
from bson import ObjectId
from app.utils.dependencies import get_current_user
from app.models.transaction import Transaction
from app.db.session import init_db
from datetime import datetime
from beanie.operators import RegEx, Or

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
    amount: Optional[float] = Query(None),
    user = Depends(get_current_user)
):
    skip = (page - 1) * limit
    
    # 1. Base Query: Always filter by user
    find_query = Transaction.find(Transaction.user_id == str(user["user_id"]))
    
    # 2. NEW: Bank Filtering Logic
    if bank and bank != "All Banks":
        find_query = find_query.find(RegEx(Transaction.bank, bank, "i"))

    # 3. Search Logic
    if search:
        import re
        # Make search robust against spaces (e.g. "bo-o" will match "bo- okmyshow")
        # b\s*o\s*\-\s*o
        fuzzy_pattern = r"\s*".join(re.escape(char) for char in search if not char.isspace())
        
        search_or = [
            RegEx(Transaction.description, fuzzy_pattern, "i"),
            RegEx(Transaction.payee, fuzzy_pattern, "i"),
            RegEx(Transaction.bank, fuzzy_pattern, "i")
        ]
        
        search_lower = search.strip().lower()
        if search_lower == "debit" or search_lower == "deb" or search_lower == "debit (-)":
            search_or.append(Transaction.debit > 0)
        if search_lower == "credit" or search_lower == "cred" or search_lower == "credit (+)":
            search_or.append(Transaction.credit > 0)
            
        # 3.1 NEW: Amount Searching
        clean_numeric = search.replace(',', '').replace('$', '').replace('₹', '').strip()
        try:
            amount_val = float(clean_numeric)
            search_or.append(Transaction.debit == amount_val)
            search_or.append(Transaction.credit == amount_val)
        except ValueError:
            pass
            
        find_query = find_query.find(Or(*search_or))
        
    # 4. Transaction Type Filter
    if type == "debit":
        find_query = find_query.find(Transaction.debit > 0)
    elif type == "credit":
        find_query = find_query.find(Transaction.credit > 0)

    # 5. Date Filter
    if start_date:
        try:
            # Handle YYYY-MM-DD or ISO
            dt_start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            find_query = find_query.find(Transaction.date >= dt_start)
        except Exception:
            pass
    
    if end_date:
        try:
            dt_end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            dt_end = dt_end.replace(hour=23, minute=59, second=59, microsecond=999999)
            find_query = find_query.find(Transaction.date <= dt_end)
        except Exception:
            pass

    # 5.1 Amount Filter (Explicit)
    if amount is not None:
        find_query = find_query.find(Or(Transaction.debit == amount, Transaction.credit == amount))

    # 6. Sorting
    sort_direction = -1 if sort == "desc" else 1
    find_query = find_query.sort([("date", sort_direction), ("_id", sort_direction)])
    
    # 7. Execution
    total_count = await find_query.count()
    
    # Calculate totals for the filtered results (ignoring pagination)
    # Using motor directly to avoid Beanie aggregate await issues in some environments
    filter_dict = find_query.get_filter_query()
    pipeline = [
        {"$match": filter_dict},
        {
            "$group": {
                "_id": None,
                "total_debit": {"$sum": "$debit"},
                "total_credit": {"$sum": "$credit"}
            }
        }
    ]
    
    aggregation = await Transaction.get_pymongo_collection().aggregate(pipeline).to_list(length=1)
    agg_result = aggregation[0] if aggregation else {"total_debit": 0, "total_credit": 0}
    
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
        "totalPages": (total_count + limit - 1) // limit,
        "summary": {
            "total_debit": agg_result["total_debit"],
            "total_credit": agg_result["total_credit"]
        }
    }

@router.get("/export")
async def export_transactions(
    search: Optional[str] = None,
    type: str = "all",
    bank: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    amount: Optional[float] = Query(None),
    user = Depends(get_current_user)
):
    """
    Exports filtered transactions as a CSV file.
    """
    import csv
    import io
    from fastapi.responses import StreamingResponse

    # Reuse filtering logic (simplified fetch for speed)
    find_query = Transaction.find(Transaction.user_id == str(user["user_id"]))
    
    if bank and bank != "All Banks":
        find_query = find_query.find(RegEx(Transaction.bank, bank, "i"))

    if search:
        import re
        fuzzy_pattern = r"\s*".join(re.escape(char) for char in search if not char.isspace())
        search_or = [
            RegEx(Transaction.description, fuzzy_pattern, "i"),
            RegEx(Transaction.payee, fuzzy_pattern, "i"),
            RegEx(Transaction.bank, fuzzy_pattern, "i")
        ]
        if search.lower() in ["debit", "deb"]: search_or.append(Transaction.debit > 0)
        if search.lower() in ["credit", "cred"]: search_or.append(Transaction.credit > 0)
        find_query = find_query.find(Or(*search_or))
        
    if type == "debit": find_query = find_query.find(Transaction.debit > 0)
    elif type == "credit": find_query = find_query.find(Transaction.credit > 0)

    if start_date:
        try:
            dt_start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            find_query = find_query.find(Transaction.date >= dt_start)
        except: pass
    
    if end_date:
        try:
            dt_end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            dt_end = dt_end.replace(hour=23, minute=59, second=59, microsecond=999999)
            find_query = find_query.find(Transaction.date <= dt_end)
        except: pass

    if amount is not None:
        find_query = find_query.find(Or(Transaction.debit == amount, Transaction.credit == amount))

    # Fetch all matching transactions
    transactions = await find_query.sort("-date").to_list()

    # Generate CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Date", "Bank", "Description", "Payee", "Category", "Debit", "Credit", "Balance"])
    
    for t in transactions:
        writer.writerow([
            t.date.strftime("%Y-%m-%d") if t.date else "N/A",
            t.bank,
            t.description,
            t.payee,
            t.category,
            f"{t.debit:.2f}" if t.debit else "0.00",
            f"{t.credit:.2f}" if t.credit else "0.00",
            f"{t.balance:.2f}"
        ])

    output.seek(0)
    
    filename = f"transactions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

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
    Batches transactions and extracts AI payees in chunks to prevent API rate limits.
    """
    from app.utils.normalize import extract_payee_name, batch_extract_payees_ai
    from app.utils.analysis import classify_category
    from pymongo import UpdateOne
    import logging

    user_id = str(user["user_id"])
    collection = Transaction.get_pymongo_collection()

    # Fetch all transactions with their description (only what we need)
    cursor = collection.find(
        {"user_id": user_id},
        {"_id": 1, "description": 1, "payee": 1}
    )
    docs = await cursor.to_list(length=None)

    if not docs:
        return {"updated": 0, "message": "No transactions found."}

    # 1. Gather uniquely grouped raw descriptions to compress API hits
    unique_desc = list(set(d.get("description", "") for d in docs if d.get("description")))
    
    # Take a sample to ensure speed + fit the prompt limits
    mapping = batch_extract_payees_ai(unique_desc[:250])

    ops = []
    for doc in docs:
        desc = doc.get("description") or ""
        # Check mapping; if not found or skipped, fall back to regex
        new_payee = mapping.get(desc) or extract_payee_name(desc)
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
        "message": f"Batched mapping complete! Refined {updated} of {len(docs)} transactions."
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
