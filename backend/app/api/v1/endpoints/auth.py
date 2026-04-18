from fastapi import APIRouter, HTTPException, Depends
from app.utils.dependencies import get_current_user
from app.database import db
from app.models.user import UserCreate, UserLogin
from app.utils.security import hash_password, verify_password
from app.utils.jwt import create_token

router = APIRouter(prefix="/auth", tags=["Auth"])

users = db.users

@router.post("/signup")
def signup(user: UserCreate):
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    if users.find_one({"$or": [{"email": user.email}, {"phone": user.phone}]}):
        raise HTTPException(status_code=400, detail="User already exists")

    users.insert_one({
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "password": hash_password(user.password)
    })

    return {"message": "Signup successful"}


@router.post("/login")
def login(data: UserLogin):
    user = users.find_one({
        "$or": [
            {"email": data.identifier},
            {"phone": data.identifier}
        ]
    })

    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({
        "user_id": str(user["_id"]),
        "email": user["email"]
    })

    return {
        "token": token,
        "user": {
            "name": user["name"],
            "email": user["email"]
        }
    }

@router.get("/me")
async def get_me(payload = Depends(get_current_user)):
    from bson import ObjectId
    user = users.find_one({"_id": ObjectId(payload["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "user_id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "phone": user.get("phone"),
        "profile_picture": user.get("profile_picture"),
        "currency": user.get("currency", "INR")
    }

from pydantic import BaseModel
from typing import Optional

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    password: Optional[str] = None
    currency: Optional[str] = None

@router.put("/me")
async def update_profile(data: ProfileUpdate, payload = Depends(get_current_user)):
    from bson import ObjectId
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.email is not None:
        update_data["email"] = data.email
    if data.phone is not None:
        update_data["phone"] = data.phone
    if data.profile_picture is not None:
        update_data["profile_picture"] = data.profile_picture
    if data.password is not None:
        update_data["password"] = hash_password(data.password)
    if data.currency is not None:
        update_data["currency"] = data.currency
        
    if update_data:
        users.update_one(
            {"_id": ObjectId(payload["user_id"])},
            {"$set": update_data}
        )
        
    return {"message": "Profile updated successfully"}