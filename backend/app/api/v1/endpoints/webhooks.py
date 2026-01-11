import re
import hashlib
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Request, Header, HTTPException
from app.models.transaction import Transaction

router = APIRouter()


WEBHOOK_SECRET = "MyBankSync2026" 

def clean_amount(text: str) -> float:
    """
    Extracts numerical amount from text strings containing currency symbols.
    Handles formats like ₹500, Rs. 500, or 1,200.50
    """
    match = re.search(r'(?:Rs\.?|INR|₹)\s?([\d,]+\.?\d*)', text)
    if match:
        # Remove commas for float conversion
        return float(match.group(1).replace(',', ''))
    return 0.0

@router.post("/upi-notification")
async def handle_upi_webhook(
    request: Request, 
    x_webhook_secret: Optional[str] = Header(None)
):
    # 1. Security Check
    if x_webhook_secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 2. Receive Data from MacroDroid
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    raw_text = payload.get("text", "")
    app_source = payload.get("app", "UPI")
    user_id = payload.get("user_id") # e.g., 693ee61197c143440f0eaacd

    if not user_id or not raw_text:
        return {"status": "ignored", "message": "Missing required data"}

    # 3. Parse Amount and Payee
    amount = clean_amount(raw_text)
    if amount <= 0:
        return {"status": "ignored", "message": "No transaction amount detected"}

    # Determine if it's Credit or Debit based on common keywords
    is_credit = any(word in raw_text.lower() for word in ["received", "credited", "added", "deposited"])
    
    # Simple Payee Extraction logic
    payee = "Unknown"
    if "to " in raw_text.lower():
        payee_match = re.search(r'to\s+(.*?)(?:\.|\susing|\sfrom|$)', raw_text, re.IGNORECASE)
        if payee_match: 
            payee = payee_match.group(1).strip()

    # 4. Generate Unique Hash (Crucial for MongoDB unique index)
    # We use user_id, text, and a timestamp to ensure uniqueness
    timestamp = datetime.utcnow().isoformat()
    txn_hash = hashlib.md5(f"{user_id}-{raw_text}-{timestamp}".encode()).hexdigest()

    # 5. Save to MongoDB using Beanie
    try:
        new_txn = Transaction(
            user_id=user_id,
            account_id="realtime_acc", 
            hash=txn_hash,
            date=datetime.utcnow(),
            description=f"⚡ {raw_text}",
            payee=payee,
            debit=amount if not is_credit else 0.0,
            credit=amount if is_credit else 0.0,
            bank=app_source.upper(),
            category="Real-time Sync",
            balance=0.0, # Balance is unknown from notification
            updated_at=datetime.utcnow()
        )
        
        await new_txn.insert()
        
        return {
            "status": "success", 
            "parsed": {
                "amount": amount, 
                "payee": payee, 
                "type": "CREDIT" if is_credit else "DEBIT"
            }
        }

    except Exception as e:
        # Handle duplicate hash or DB errors
        print(f"Database Error: {e}")
        return {"status": "error", "message": str(e)}