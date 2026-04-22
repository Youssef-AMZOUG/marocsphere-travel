from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from pydantic import BaseModel
from database import db
from auth import hash_password, verify_password, create_token, get_current_user
from models import UserRegister, UserLogin
from subscriptions import TravelerPlan
from email_utils import send_email, build_reset_password_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

ACCOUNT_ROLES = {"client", "artisan", "agency", "hotel"}


def _normalize_account_role(role: Optional[str]) -> str:
    role = (role or "client").strip().lower()
    return role if role in ACCOUNT_ROLES else "client"


@router.post("/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    account_role = _normalize_account_role(data.account_role)
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "created_at": now,
        "account_role": account_role,
        "plan_type": "traveler" if account_role == "client" else "partner",
        "plan_id": TravelerPlan.EXPLORER if account_role == "client" else "free_listing",
        "subscription_status": "active",
        "subscription_start": now,
        "subscription_end": None,
        "phone": data.phone,
        "city": data.city,
        "business_name": data.business_name,
    }

    partner_payload = None
    if account_role != "client":
        partner_id = str(uuid.uuid4())
        user_doc["partner_id"] = partner_id
        partner_payload = {
            "id": partner_id,
            "user_id": user_id,
            "business_name": data.business_name or data.name,
            "partner_type": account_role,
            "city": data.city or "",
            "address": None,
            "description": None,
            "license_number": None,
            "languages": ["french", "arabic"],
            "years_experience": None,
            "website": None,
            "plan_id": "free_listing",
            "status": "pending_verification",
            "verified": False,
            "passport_of_good": False,
            "rating": 0,
            "reviews_count": 0,
            "bookings_count": 0,
            "created_at": now,
        }

    await db.users.insert_one(user_doc)
    if partner_payload:
        await db.partners.insert_one(partner_payload)

    token = create_token(user_id, data.email, data.name)
    response_user = {k: v for k, v in user_doc.items() if k != "password"}
    return {
        "token": token,
        "user": response_user,
        "partner": partner_payload and {k: v for k, v in partner_payload.items()},
    }


@router.post("/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["email"], user["name"])
    user_without_password = {k: v for k, v in user.items() if k != "password"}
    return {"token": token, "user": user_without_password}


@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    full_user = await db.users.find_one({"id": user["user_id"]}, {"_id": 0, "password": 0})
    if full_user:
        return {"user": full_user}
    return {"user": user}



class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None
    travel_style: Optional[str] = None
    interests: Optional[List[str]] = None
    bio: Optional[str] = None
    avatar_color: Optional[str] = None


@router.put("/profile")
async def update_profile(data: ProfileUpdate, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    update_fields = {}
    for field in ["name", "phone", "preferred_language", "travel_style", "interests", "bio", "avatar_color"]:
        val = getattr(data, field)
        if val is not None:
            update_fields[field] = val

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": user["user_id"]}, {"$set": update_fields})

    # If name changed, issue new token
    new_token = None
    if "name" in update_fields:
        new_token = create_token(user["user_id"], user["email"], update_fields["name"])

    full_user = await db.users.find_one({"id": user["user_id"]}, {"_id": 0, "password": 0})
    return {"user": full_user, "token": new_token}



class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, request: Request):
    user = await db.users.find_one({"email": data.email})
    if not user:
        return {"message": "If an account exists, a reset link has been sent."}

    reset_token = str(uuid.uuid4())
    await db.password_resets.insert_one({
        "user_id": user["id"],
        "email": data.email,
        "token": reset_token,
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Build reset URL from request origin
    origin = request.headers.get("origin") or request.headers.get("referer", "").rstrip("/")
    if not origin:
        origin = "https://marocsphere.com"
    reset_url = f"{origin}/auth/reset-password?token={reset_token}"

    # Send real email via Gmail SMTP
    html_body = build_reset_password_email(reset_url)
    email_sent = await send_email(
        to_email=data.email,
        subject="Reset Your MarocSphere Password",
        html_body=html_body,
    )

    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "type": "password_reset",
        "user_id": user["id"],
        "email": data.email,
        "reset_token": reset_token,
        "status": "sent" if email_sent else "failed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    result = {"message": "If an account exists, a reset link has been sent."}
    if not email_sent:
        result["reset_token"] = reset_token
    return result


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    record = await db.password_resets.find_one({"token": data.token, "used": False})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    # Check if token is less than 1 hour old
    created = datetime.fromisoformat(record["created_at"])
    now = datetime.now(timezone.utc)
    if (now - created).total_seconds() > 3600:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    new_hash = hash_password(data.new_password)
    await db.users.update_one({"id": record["user_id"]}, {"$set": {"password": new_hash}})
    await db.password_resets.update_one({"token": data.token}, {"$set": {"used": True}})

    return {"message": "Password has been reset successfully"}
