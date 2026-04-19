from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from beanie import PydanticObjectId
import httpx
import os

from app.utils.dependencies import get_current_user
from app.models.metals import MetalAsset

router = APIRouter(prefix="/metals", tags=["metals"])

GOLD_API_KEY = os.environ.get("GOLD_API_KEY")
GOLD_API_BASE = os.environ.get("GOLD_API_BASE", "https://www.goldapi.io/api")

# Metal symbol display names
METAL_NAMES = {
    "XAU": "Gold",
    "XAG": "Silver",
    "XPT": "Platinum",
    "XPD": "Palladium",
}


# ── Payloads ──────────────────────────────────────────────────────────────────

class MetalAssetPayload(BaseModel):
    metal_type: str          # XAU | XAG | XPT | XPD
    item_name: str
    quantity: float          # grams
    purchase_price: float    # per gram in user's currency
    purchase_date: Optional[datetime] = None
    note: Optional[str] = None
    image_url: Optional[str] = None


# ── Serialiser ────────────────────────────────────────────────────────────────

def _serialize(a: MetalAsset) -> dict:
    return {
        "_id": str(a.id),
        "metal_type": a.metal_type,
        "metal_name": METAL_NAMES.get(a.metal_type, a.metal_type),
        "item_name": a.item_name,
        "quantity": a.quantity,
        "purchase_price": a.purchase_price,
        "purchase_date": a.purchase_date.isoformat(),
        "note": a.note,
        "image_url": a.image_url,
        "created_at": a.created_at.isoformat(),
    }


# ── GET /live-prices ──────────────────────────────────────────────────────────

@router.get("/live-prices")
async def get_live_prices(currency: str = "USD"):
    """Fetch live spot price (per gram) from GoldAPI for all 4 metals."""
    metals = ["XAU", "XAG", "XPT", "XPD"]
    prices = {}
    headers = {
        "x-access-token": GOLD_API_KEY,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        for symbol in metals:
            try:
                url = f"{GOLD_API_BASE}/{symbol}/{currency.upper()}"
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    
                    if "error" in data:
                        prices[symbol] = {"error": data["error"], "price_per_gram": 0}
                    else:
                        # GoldAPI returns price per troy ounce — convert to grams (1 troy oz = 31.1035g)
                        price_per_oz = data.get("price", 0)
                        price_per_gram = price_per_oz / 31.1035
                        prices[symbol] = {
                            "price_per_gram": round(price_per_gram, 4),
                            "price_per_oz": price_per_oz,
                            "currency": currency.upper(),
                            "name": METAL_NAMES.get(symbol, symbol),
                            "timestamp": data.get("timestamp"),
                            "ch": data.get("ch", 0),       # change
                            "chp": data.get("chp", 0),     # change %
                        }
                else:
                    prices[symbol] = {"error": f"API error {resp.status_code}", "price_per_gram": 0}
            except Exception as e:
                prices[symbol] = {"error": str(e), "price_per_gram": 0}

    return prices


# ── GET /portfolio ─────────────────────────────────────────────────────────────

@router.get("/portfolio")
async def get_portfolio(user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    assets = await MetalAsset.find(MetalAsset.user_id == uid).sort("-purchase_date").to_list()
    return {"items": [_serialize(a) for a in assets]}


# ── POST / ────────────────────────────────────────────────────────────────────

@router.post("/")
async def add_asset(payload: MetalAssetPayload, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    asset = MetalAsset(
        user_id=uid,
        metal_type=payload.metal_type.upper(),
        item_name=payload.item_name,
        quantity=payload.quantity,
        purchase_price=payload.purchase_price,
        purchase_date=payload.purchase_date or datetime.utcnow(),
        note=payload.note,
        image_url=payload.image_url,
    )
    await asset.insert()
    return _serialize(asset)


# ── PUT /{id} ─────────────────────────────────────────────────────────────────

@router.put("/{id}")
async def update_asset(id: str, payload: MetalAssetPayload, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    asset = await MetalAsset.get(id)
    if not asset or asset.user_id != uid:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset.metal_type = payload.metal_type.upper()
    asset.item_name = payload.item_name
    asset.quantity = payload.quantity
    asset.purchase_price = payload.purchase_price
    asset.purchase_date = payload.purchase_date or asset.purchase_date
    asset.note = payload.note
    asset.image_url = payload.image_url
    asset.updated_at = datetime.utcnow()
    await asset.save()
    return _serialize(asset)


# ── DELETE /{id} ──────────────────────────────────────────────────────────────

@router.delete("/{id}")
async def delete_asset(id: str, user=Depends(get_current_user)):
    uid = PydanticObjectId(user["user_id"])
    asset = await MetalAsset.get(id)
    if not asset or asset.user_id != uid:
        raise HTTPException(status_code=404, detail="Asset not found")

    await asset.delete()
    return {"status": "deleted"}
