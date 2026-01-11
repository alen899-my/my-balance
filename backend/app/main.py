from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
# Added budget to the imports below
from app.api.v1.endpoints import auth, transactions, upload, insights, budget ,webhooks
from app.db.session import init_db
import logging

# Global Logging Config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

load_dotenv()

app = FastAPI(title="Bank App API", version="2.0")

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
# Added the budget router inclusion
app.include_router(budget.router) 
app.include_router(webhooks.router, prefix="/transactions")

@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/")
def health_check():
    return {"status": "ok", "version": "2.0"}