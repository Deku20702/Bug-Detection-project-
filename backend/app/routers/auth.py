import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import mongo_db
from app.deps import get_current_user_email
from app.schemas import AuthResponse, LoginRequest, RegisterRequest
from app.security import create_access_token, hash_password, verify_password

from google.oauth2 import id_token
from google.auth.transport import requests

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest) -> AuthResponse:
    users = mongo_db["users"]
    if users.find_one({"email": payload.email}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    users.insert_one({
        "name": payload.email.split("@")[0],
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "role": "free",
        "created_at": datetime.now(timezone.utc),
    })
    token = create_access_token(payload.email)
    return AuthResponse(access_token=token)

@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    user = mongo_db["users"].find_one({"email": payload.email})

    # ❌ DO NOT create user here
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User does not exist"
        )

    # ⚠️ Handle Google users (no password)
    if user.get("password_hash") is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please login using Google"
        )

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token = create_access_token(payload.email)
    return AuthResponse(access_token=access_token)

@router.get("/me")
def me(email: str = Depends(get_current_user_email)) -> dict:
    user = mongo_db["users"].find_one({"email": email}, {"password_hash": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user["id"] = str(user.pop("_id"))
    return user

@router.post("/google", response_model=AuthResponse)
def google_auth(payload: dict) -> AuthResponse:
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token missing")
    try:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo["email"]
        users = mongo_db["users"]
        user = users.find_one({"email": email})
        if not user:
            users.insert_one({
                "name": email.split("@")[0],
                "email": email,
                "password_hash": None,
                "role": "free",
                "created_at": datetime.now(timezone.utc),
            })
        access_token = create_access_token(email)
        return AuthResponse(access_token=access_token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")
