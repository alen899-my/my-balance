from fastapi import APIRouter, HTTPException
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

    return {"token": token}