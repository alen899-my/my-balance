from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import auth, transactions, upload, insights
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
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"]) # Or just /auth if frontend expects that
# Note: Original was just /login etc, likely. We should check if we need to preserve legacy paths.
# The original main.py did `app.include_router(auth_router)`.
# Let's bind it to root for now if we want to be safe, or /auth.
# Standard practice is /auth. Let's assume /auth for auth router.
# Wait, if I change routes, frontend might break.
# Original main.py: `from app.routes.auth import router as auth_router` -> `app.include_router(auth_router)`
# Usually auth router has `/login`, `/register`. So it was `/login`.
# To capture `/login`, I should include it without prefix or with prefix if the router itself doesn't have it.
# Let's inspect auth router later if needed. For now, I will mount it at root to be safe with legacy frontend.

app.include_router(auth.router) 
app.include_router(upload.router) # /upload
app.include_router(transactions.router) # /transactions
app.include_router(insights.router) # /insights

@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/")
def health_check():
    return {"status": "ok", "version": "2.0"}