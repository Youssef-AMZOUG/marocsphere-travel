from fastapi import APIRouter, HTTPException, Header
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from database import db
from auth import hash_password, create_token, get_current_user
from models import PartnerRegister

router = APIRouter(prefix="/api/partners", tags=["partners"])


@router.post("/register")
async def register_partner(data: PartnerRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    partner_id = str(uuid.uuid4())

    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "phone": data.phone,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "plan_type": "partner",
        "plan_id": "free_listing",
        "partner_id": partner_id,
        "subscription_status": "active",
    }
    await db.users.insert_one(user_doc)

    partner_doc = {
        "id": partner_id,
        "user_id": user_id,
        "business_name": data.business_name,
        "partner_type": data.partner_type,
        "city": data.city,
        "address": data.address,
        "description": data.description,
        "license_number": data.license_number,
        "languages": data.languages,
        "years_experience": data.years_experience,
        "website": data.website,
        "plan_id": "free_listing",
        "status": "pending_verification",
        "verified": False,
        "passport_of_good": False,
        "rating": 0,
        "reviews_count": 0,
        "bookings_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.partners.insert_one(partner_doc)

    token = create_token(user_id, data.email, data.name)

    return {
        "token": token,
        "user": {"id": user_id, "name": data.name, "email": data.email, "plan_type": "partner"},
        "partner": {"id": partner_id, "business_name": data.business_name, "status": "pending_verification"}
    }


@router.get("/me")
async def get_partner_profile(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    full_user = await db.users.find_one({"id": user["user_id"]}, {"_id": 0})
    if not full_user or full_user.get("plan_type") != "partner":
        raise HTTPException(status_code=403, detail="Not a partner account")

    partner = await db.partners.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")

    return {"partner": partner, "user": {k: v for k, v in full_user.items() if k != "password"}}


@router.get("")
async def list_partners(city: Optional[str] = None, partner_type: Optional[str] = None, verified: bool = True):
    query = {"status": "verified"} if verified else {}
    if city:
        query["city"] = city
    if partner_type:
        query["partner_type"] = partner_type

    partners = await db.partners.find(query, {"_id": 0}).to_list(100)
    return {"partners": partners}


@router.get("/stats")
async def get_partner_stats(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    full_user = await db.users.find_one({"id": user["user_id"]}, {"_id": 0})
    if not full_user or full_user.get("plan_type") != "partner":
        raise HTTPException(status_code=403, detail="Not a partner account")

    partner = await db.partners.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")

    partner_id = partner["id"]

    # Booking stats
    total_bookings = await db.bookings.count_documents({"partner_id": partner_id})
    pending_bookings = await db.bookings.count_documents({"partner_id": partner_id, "status": "pending"})
    confirmed_bookings = await db.bookings.count_documents({"partner_id": partner_id, "status": "confirmed"})
    completed_bookings = await db.bookings.count_documents({"partner_id": partner_id, "status": "completed"})
    cancelled_bookings = await db.bookings.count_documents({"partner_id": partner_id, "status": "cancelled"})

    # Revenue
    revenue_pipeline = [
        {"$match": {"partner_id": partner_id, "status": {"$in": ["confirmed", "completed"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    rev_result = await db.bookings.aggregate(revenue_pipeline).to_list(1)
    total_revenue = rev_result[0]["total"] if rev_result else 0

    # Reviews
    review_count = await db.reviews.count_documents({"target_id": partner_id})
    rating_pipeline = [
        {"$match": {"target_id": partner_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}}}
    ]
    rating_result = await db.reviews.aggregate(rating_pipeline).to_list(1)
    avg_rating = round(rating_result[0]["avg"], 1) if rating_result else 0

    # Profile views (from a simple counter in partner doc)
    views_this_month = partner.get("views_this_month", 0)

    return {
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "confirmed_bookings": confirmed_bookings,
        "completed_bookings": completed_bookings,
        "cancelled_bookings": cancelled_bookings,
        "total_revenue": total_revenue,
        "this_month_revenue": total_revenue,
        "rating": avg_rating,
        "total_reviews": review_count,
        "views_this_month": views_this_month,
    }


@router.get("/bookings")
async def get_partner_bookings(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    partner = await db.partners.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")

    bookings = await db.bookings.find(
        {"partner_id": partner["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    return {"bookings": bookings}


@router.post("/bookings/{booking_id}/accept")
async def accept_booking(booking_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": "confirmed", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Booking confirmed", "booking_id": booking_id}


@router.post("/bookings/{booking_id}/decline")
async def decline_booking(booking_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Booking declined", "booking_id": booking_id}


@router.get("/{partner_id}")
async def get_partner(partner_id: str):
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return {"partner": partner}
