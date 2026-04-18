from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from beanie import PydanticObjectId

from app.utils.dependencies import get_current_user
from app.models.wallet import WalletTransaction

router = APIRouter(prefix="/wallet", tags=["wallet"])

class WalletPayload(BaseModel):
    description: str
    amount: float
    type: str  # "add", "spend", "set_balance"
    category: str
    receipt_url: Optional[str] = None
    transaction_date: Optional[datetime] = None

@router.get("/summary")
async def get_wallet_summary(user = Depends(get_current_user)):
    user_id = PydanticObjectId(user["user_id"])
    
    # Calculate current balance
    transactions = await WalletTransaction.find(WalletTransaction.user_id == user_id).to_list()
    
    balance = 0.0
    total_added = 0.0
    total_spent = 0.0
    
    for t in transactions:
        if t.type == "add":
            balance += t.amount
            total_added += t.amount
        elif t.type == "spend":
            balance -= t.amount
            total_spent += t.amount
        elif t.type == "set_balance":
            # If it's a set balance, it overrides everything BEFORE it.
            # To handle this properly, maybe we sort array by date.
            # Actually, let's treat set_balance as "Add diff" or just recalculate it simply
            pass

    # A better approach for set_balance:
    # Just sort by date ascending and apply operations
    transactions.sort(key=lambda x: x.transaction_date)
    balance = 0.0
    total_added = 0.0
    total_spent = 0.0
    
    for t in transactions:
        if t.type == "add":
            balance += t.amount
            total_added += t.amount
        elif t.type == "spend":
            balance -= t.amount
            total_spent += t.amount
        elif t.type == "set_balance":
            # Adjust the balance to the specified amount
            diff = t.amount - balance
            if diff > 0:
                total_added += diff
            else:
                total_spent += abs(diff)
            balance = t.amount

    return {
        "balance": balance,
        "total_added": total_added,
        "total_spent": total_spent
    }

@router.get("/transactions")
async def get_wallet_transactions(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    user = Depends(get_current_user)
):
    user_id = PydanticObjectId(user["user_id"])
    query = [WalletTransaction.user_id == user_id]
    
    if month and year:
        query.append(WalletTransaction.month == month)
        query.append(WalletTransaction.year == year)
        
    transactions = await WalletTransaction.find(*query).sort("-transaction_date").to_list()
    
    serialized = []
    for t in transactions:
        serialized.append({
            "_id": str(t.id),
            "description": t.description,
            "amount": t.amount,
            "type": t.type,
            "category": t.category,
            "receipt_url": t.receipt_url,
            "transaction_date": t.transaction_date.isoformat(),
            "month": t.month,
            "year": t.year
        })
        
    return {"items": serialized}

@router.post("/")
async def create_wallet_transaction(
    payload: WalletPayload,
    user = Depends(get_current_user)
):
    user_id = PydanticObjectId(user["user_id"])
    date_to_use = payload.transaction_date or datetime.utcnow()
    
    txn = WalletTransaction(
        user_id=user_id,
        description=payload.description,
        amount=payload.amount,
        type=payload.type,
        category=payload.category,
        receipt_url=payload.receipt_url,
        transaction_date=date_to_use,
        month=date_to_use.month,
        year=date_to_use.year
    )
    await txn.insert()
    
    return {
        "_id": str(txn.id),
        "description": txn.description,
        "amount": txn.amount,
        "type": txn.type,
        "category": txn.category,
        "receipt_url": txn.receipt_url,
        "transaction_date": txn.transaction_date.isoformat(),
    }

@router.delete("/{id}")
async def delete_wallet_transaction(id: str, user = Depends(get_current_user)):
    user_id = PydanticObjectId(user["user_id"])
    txn = await WalletTransaction.get(id)
    
    if not txn or txn.user_id != user_id:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    await txn.delete()
    return {"status": "success"}

@router.put("/{id}")
async def update_wallet_transaction(
    id: str,
    payload: WalletPayload,
    user = Depends(get_current_user)
):
    user_id = PydanticObjectId(user["user_id"])
    txn = await WalletTransaction.get(id)
    
    if not txn or txn.user_id != user_id:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    txn.description = payload.description
    txn.amount = payload.amount
    txn.type = payload.type
    txn.category = payload.category
    txn.receipt_url = payload.receipt_url
    if payload.transaction_date:
        txn.transaction_date = payload.transaction_date
        txn.month = payload.transaction_date.month
        txn.year = payload.transaction_date.year
        
    await txn.save()
    return {
        "_id": str(txn.id),
        "description": txn.description,
        "amount": txn.amount,
        "type": txn.type,
        "category": txn.category,
        "receipt_url": txn.receipt_url,
        "transaction_date": txn.transaction_date.isoformat(),
    }
