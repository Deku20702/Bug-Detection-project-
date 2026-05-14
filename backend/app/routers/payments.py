from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import mongo_db
from app.deps import get_current_user_email

router = APIRouter()


@router.post("/create-order")
def create_order(email: str = Depends(get_current_user_email)) -> dict:
    # Placeholder order for Razorpay integration path.
    order = {
        "order_id": f"order_{int(datetime.now(timezone.utc).timestamp())}",
        "amount": 49900,
        "currency": "INR",
        "plan": "pro_monthly",
    }
    mongo_db["payments"].insert_one(
        {
            "email": email,
            "status": "created",
            "order": order,
            "created_at": datetime.now(timezone.utc),
        }
    )
    return order


@router.post("/webhook")
def payment_webhook(payload: dict) -> dict:
    email = payload.get("email")
    success = bool(payload.get("success", False))
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="email missing")

    if success:
        mongo_db["users"].update_one(
            {"email": email},
            {
                "$set": {
                    "role": "pro",
                    "subscription_expires_at": datetime.now(timezone.utc) + timedelta(days=30),
                }
            },
        )
    mongo_db["payments"].insert_one(
        {
            "email": email,
            "status": "captured" if success else "failed",
            "payload": payload,
            "created_at": datetime.now(timezone.utc),
        }
    )
    return {"message": "Webhook processed"}

