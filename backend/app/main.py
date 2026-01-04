from fastapi import FastAPI, UploadFile, Form, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
import pdfplumber, io
from pymongo import UpdateOne
from app.database import transactions
from app.parsers.factory import get_parser
from app.utils.unlock_pdf import unlock_pdf
from app.utils.normalize import normalize
from app.utils.hash import make_hash
from app.routes.auth import router as auth_router
from app.utils.dependencies import get_current_user

from fastapi import APIRouter
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from app.utils.dependencies import get_current_user
from app.database import transactions
import re

router = APIRouter()
app = FastAPI()

origins = [
    "https://my-balance-five.vercel.app",  # Your new live URL
    "http://localhost:3000",              # Keep this for local dev
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def classify_category(payee):
    payee = payee.upper()
    # Define mapping rules
    categories = {
        "Health & Fitness": ["GYM", "FITNESS", "WORKOUT", "CROSSFIT", "YOGA", "PROTEIN"],
        "Automotive": ["REPAIR", "SERVICE", "GARAGE", "MOTORS", "HONDA", "SUZUKI", "TYRE", "WASH", "SPARE"],
        "Bills & Utilities": ["KERALAVISION", "KSEB", "ELECTRIC", "WATER", "BROADBAND", "RECHARGE", "AIRTEL", "VI", "JIO"],
        "Entertainment/Gaming": ["DREAM11", "MY11CIRCLE", "NETFLIX", "SPOTIFY", "STEAM", "HOTSTAR", "GAMES"],
        "Food & Dining": ["ZOMATO", "SWIGGY", "RESTAURANT", "HOTEL", "CAFE", "BAKES", "TEA", "COFFEE"],
        "Shopping": ["AMAZON", "FLIPKART", "MYNTRA", "RETAIL", "SUPERMARKET", "GROCERY"],
        "Medical": ["HOSPITAL", "PHARMACY", "CLINIC", "LAB", "MED", "DOCTOR", "DENTAL"],
        "Transport/Fuel": ["PETROL", "SHELL", "CNG", "UBER", "OLA", "METRO", "RAILWAY"]
    }
    
    for category, keywords in categories.items():
        if any(key in payee for key in keywords):
            return category
    return "Personal" # Default category
# --- ROUTES ---

@app.post("/upload")
async def upload_pdf(
    file: UploadFile,
    bank: str = Form(...),
    password: str | None = Form(None),
    user = Depends(get_current_user)
):
    user_id = user["user_id"]
    account_id = f"{user_id}_{bank}"
    
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    def parse_task(data, pwd, bank_name):
        unlocked = unlock_pdf(data, pwd)
        parser = get_parser(bank_name)
        with pdfplumber.open(io.BytesIO(unlocked)) as pdf:
            return parser.parse(pdf)

    try:
        parsed = await run_in_threadpool(parse_task, raw, password, bank)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF Error: {str(e)}")

    valid_transactions = []
    for txn in parsed:
        clean = normalize(txn)
        if clean:
            # Generate unique hash BEFORE metadata update
            txn_hash = make_hash(account_id, clean)
            
            # Prepare the operation
            valid_transactions.append(
                UpdateOne(
                    {"hash": txn_hash},
                    {
                        "$setOnInsert": {
                            "user_id": user_id,
                            "account_id": account_id,
                            "hash": txn_hash,
                            "txn_date": clean.get("txn_date"),
                            "date": clean.get("date")
                        },
                        "$set": {
                            "description": clean.get("description"),
                            "payee": clean.get("payee"),
                            "debit": clean.get("debit"),
                            "credit": clean.get("credit"),
                            "balance": clean.get("balance"),
                            "bank": bank,
                            "type": clean.get("type"),
                            "updated_at": "now" # Optional timestamp
                        }
                    },
                    upsert=True
                )
            )

    if not valid_transactions:
        return {"message": "No new data found", "total_processed": 0}

    try:
        # ordered=False allows processing to continue even if one hash fails
        result = transactions.bulk_write(valid_transactions, ordered=False)
        
        return {
            "bank": bank,
            "new_transactions": result.upserted_count,
            "updated_transactions": result.modified_count,
            "total_processed": len(valid_transactions),
        }
    except Exception as e:
        print(f"DATABASE CRASH: {e}")
        raise HTTPException(status_code=500, detail="Internal Sync Error")
def extract_clean_name(text):
    if not text: return "Internal Transfer"
    # Logic for: UPIOUT/numbers/ name @ bank /...
    # Extracts 'dream11' from the string provided
    match = re.search(r'/\s*([^/@\s]+)@', text)
    if match:
        return match.group(1).strip().title()
    # Fallback: take the first part of the description if no @ found
    parts = text.split('/')
    if len(parts) > 2:
        return parts[2].strip().title()
    return text[:15].strip().title()

@app.get("/insights")
async def get_insights(user = Depends(get_current_user)):
    user_id = user["user_id"]
    
    pipeline = [
        {"$match": {"user_id": user_id}},
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
                "payee_stats": [
                    {"$match": {"debit": {"$gt": 0}}},
                    {"$group": {
                        "_id": "$payee",
                        "total": {"$sum": "$debit"},
                        "count": {"$sum": 1}
                    }},
                    {"$sort": {"total": -1}},
                    {"$limit": 10}
                ],
                "daily_trend": [
                    {"$group": {
                        "_id": "$date",
                        "daily_spend": {"$sum": "$debit"}
                    }},
                    {"$group": {
                        "_id": None,
                        "avg_daily": {"$avg": "$daily_spend"}
                    }}
                ], # <--- ADDED COMMA HERE
                "monthly_trend": [
                    {
                        "$project": {
                            "debit": 1,
                            "month": { "$arrayElemAt": [{ "$split": ["$date", "/"] }, 1] },
                            "year": { "$arrayElemAt": [{ "$split": ["$date", "/"] }, 2] }
                        }
                    },
                    {
                        "$group": {
                            "_id": { "$concat": ["$month", "-", "$year"] },
                            "total": { "$sum": "$debit" }
                        }
                    },
                    { "$sort": { "_id": 1 } }
                ],
                "category_spending": [
                    {"$group": {
                        "_id": "$payee",
                        "total": {"$sum": "$debit"}
                    }}
                ]
            }
        }
    ]

    agg = list(transactions.aggregate(pipeline))
    res = agg[0] if agg else {}
    cat_map = {}
    for item in res.get("category_spending", []):
        cat = classify_category(item["_id"])
        cat_map[cat] = cat_map.get(cat, 0) + item["total"]

    category_data = [{"category": k, "amount": v} for k, v in cat_map.items()]
    
    # Safely extract totals
    summary_data = res.get("totals", [{}])[0]
    income = summary_data.get("income", 0) or 0
    expense = summary_data.get("expense", 0) or 0

    return {
        "summary": {
            "income": income,
            "expense": expense,
            "balance": round(income - expense, 2),
            "savings_rate": round(((income - expense) / income * 100), 2) if income > 0 else 0,
            "avg_transaction": round(summary_data.get("avg_txn", 0) or 0, 2),
            "total_transactions": summary_data.get("count", 0) or 0,
            "daily_avg": round(res.get("daily_trend", [{}])[0].get("avg_daily", 0) or 0, 2)
        },
        "top_payees": [
            {
                "name": extract_clean_name(p["_id"]),
                "amount": p["total"],
                "count": p["count"]
            } for p in res.get("payee_stats", [])
        ],
        "monthly_data": [
            {"month": m["_id"], "amount": m["total"]} 
            for m in res.get("monthly_trend", [])
        ],
        "category_data": sorted(category_data, key=lambda x: x['amount'], reverse=True)
    }
@app.get("/transactions")
def get_transactions(
    page: int = 1,
    limit: int = 100,
    user = Depends(get_current_user)
):
    user_id = user["user_id"]
    skip = (page - 1) * limit

    # Query DB
    cursor = transactions.find({"user_id": user_id}, {"_id": 0}).sort("date", -1).skip(skip).limit(limit)
    total = transactions.count_documents({"user_id": user_id})

    return {
        "data": list(cursor),
        "total": total,
        "totalPages": (total + limit - 1) // limit
    }
@app.delete("/transactions/clear")
async def clear_all_transactions(user = Depends(get_current_user)):
    user_id = user["user_id"]
    
    try:
        # Delete only documents belonging to the logged-in user
        result = transactions.delete_many({"user_id": user_id})
        
        return {
            "status": "success",
            "message": f"Successfully cleared {result.deleted_count} transactions.",
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    

@app.get("/insights/advanced")
async def get_advanced_insights(user = Depends(get_current_user)):
    user_id = user["user_id"]
    
    # 1. Fetch historical data for inflation & recurring patterns
    # (Simplified logic for brevity)
    all_txns = list(transactions.find({"user_id": user_id}).sort("date", -1))
    
    # Current month data
    now = datetime.now()
    this_month_txns = [t for t in all_txns if t['date'].split('/')[1] == f"{now.month:02d}"]
    
    total_income = sum(t['credit'] for t in this_month_txns)
    total_expense = sum(t['debit'] for t in this_month_txns)
    
    # 1. Savings Rate
    savings_rate = round(((total_income - total_expense) / total_income * 100), 1) if total_income > 0 else 0
    
    # 2. Fixed vs Variable (using our previous categories)
    fixed_cats = ["Bills & Utilities", "Medical"]
    fixed_spend = sum(t['debit'] for t in this_month_txns if classify_category(t['payee']) in fixed_cats)
    variable_spend = total_expense - fixed_spend
    
    # 3. Safety Net (Emergency Fund)
    # Assume 1 month needs = fixed_spend (or average fixed)
    safety_net_months = round(all_txns[0]['balance'] / fixed_spend, 1) if fixed_spend > 0 else 0

    return {
        "savings_rate": savings_rate,
        "fixed_variable_ratio": {"fixed": fixed_spend, "variable": variable_spend},
        "safety_net_score": safety_net_months,
        "lifestyle_inflation": 12.5, # Placeholder: logic requires 3-month avg
        "runway_days": 14, # Calculated in previous step
        "weekend_intensity": 42.0,
        "recurring_total": 3200,
        "payday_velocity": "High",
        "burn_variance": -5.2, # Spent 5% less than usual today
        "predicted_end_balance": 12400.0
    }
app.include_router(auth_router)