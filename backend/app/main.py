from contextlib import asynccontextmanager
from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import auth, transactions, upload, insights, budget, webhooks, daily_budget, reports, subscriptions, goals, calendar, ocr, wallet, lendborrow, metals, properties, income, my_subscriptions, emi
from app.db.session import init_db
from app.services.subscription_scheduler import start_scheduler, stop_scheduler
import logging

# Global Logging Config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

load_dotenv()

# ── Lifespan: startup + shutdown ───────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    start_scheduler()           # 🕐 auto subscription reminders every 24 h
    yield
    # Shutdown
    stop_scheduler()

app = FastAPI(title="Bank App API", version="2.0", lifespan=lifespan)

# CORS
origins = [
    "https://my-balance-five.vercel.app",
    "https://my-balance-brdn.vercel.app",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(transactions.router)
app.include_router(insights.router)
app.include_router(budget.router)
app.include_router(webhooks.router, prefix="/transactions")
app.include_router(daily_budget.router)
app.include_router(reports.router)
app.include_router(subscriptions.router)
app.include_router(goals.router)
app.include_router(calendar.router)
app.include_router(ocr.router)
app.include_router(wallet.router)
app.include_router(lendborrow.router)
app.include_router(metals.router)
app.include_router(properties.router)
app.include_router(income.router)
app.include_router(my_subscriptions.router)
app.include_router(emi.router)

@app.get("/")
def health_check():
    return {"status": "ok", "version": "2.0"}