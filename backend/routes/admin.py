from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from datetime import datetime, timezone
import uuid
import logging

from database import db
from auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


async def _require_admin(authorization: Optional[str] = None):
    """Simple admin check — in production, verify admin role from DB."""
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    # Check if user has admin role
    full_user = await db.users.find_one({"id": user["user_id"]}, {"_id": 0})
    if not full_user or full_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/stats")
async def get_platform_stats(authorization: Optional[str] = Header(None)):
    await _require_admin(authorization)

    total_users = await db.users.count_documents({})
    total_partners = await db.partners.count_documents({})
    pending_verifications = await db.partners.count_documents({"status": "pending_verification"})
    verified_partners = await db.partners.count_documents({"status": "verified"})

    # Revenue from paid transactions
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.payment_transactions.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0

    total_itineraries = await db.itineraries.count_documents({})
    total_reviews = await db.reviews.count_documents({})
    pending_flags = await db.content_flags.count_documents({"status": "pending"})

    return {
        "total_users": total_users,
        "total_partners": total_partners,
        "pending_verifications": pending_verifications,
        "verified_partners": verified_partners,
        "total_revenue": total_revenue,
        "total_itineraries": total_itineraries,
        "total_reviews": total_reviews,
        "pending_flags": pending_flags,
    }


@router.get("/partners/pending")
async def get_pending_partners(authorization: Optional[str] = Header(None)):
    await _require_admin(authorization)

    partners = await db.partners.find(
        {"status": "pending_verification"}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    # Enrich with user contact info
    for partner in partners:
        user = await db.users.find_one({"id": partner.get("user_id")}, {"_id": 0, "password": 0})
        if user:
            partner["contact_email"] = user.get("email")
            partner["contact_phone"] = user.get("phone")
            partner["contact_name"] = user.get("name")

    return {"partners": partners}


@router.post("/partners/{partner_id}/approve")
async def approve_partner(partner_id: str, authorization: Optional[str] = Header(None)):
    admin = await _require_admin(authorization)

    partner = await db.partners.find_one({"id": partner_id})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    await db.partners.update_one(
        {"id": partner_id},
        {"$set": {"status": "verified", "verified": True, "verified_at": datetime.now(timezone.utc).isoformat()}}
    )

    # Log activity
    await db.admin_activity.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": admin["user_id"],
        "action": "partner_approved",
        "target_id": partner_id,
        "target_name": partner.get("business_name", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Mock email notification
    user = await db.users.find_one({"id": partner.get("user_id")}, {"_id": 0, "password": 0})
    email_to = user.get("email", "unknown") if user else "unknown"
    logger.info(f"[EMAIL NOTIFICATION] Partner APPROVED — To: {email_to}, Business: {partner.get('business_name', '')}, Partner ID: {partner_id}")
    await db.email_notifications.insert_one({
        "id": str(uuid.uuid4()),
        "to": email_to,
        "subject": f"Your partner application for '{partner.get('business_name', '')}' has been approved!",
        "body": f"Congratulations! Your business '{partner.get('business_name', '')}' is now verified on MarocSphere. You can start receiving bookings.",
        "type": "partner_approved",
        "partner_id": partner_id,
        "status": "logged",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"message": "Partner approved", "partner_id": partner_id, "email_sent_to": email_to}


@router.post("/partners/{partner_id}/reject")
async def reject_partner(partner_id: str, authorization: Optional[str] = Header(None)):
    admin = await _require_admin(authorization)

    partner = await db.partners.find_one({"id": partner_id})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    await db.partners.update_one(
        {"id": partner_id},
        {"$set": {"status": "rejected", "rejected_at": datetime.now(timezone.utc).isoformat()}}
    )

    await db.admin_activity.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": admin["user_id"],
        "action": "partner_rejected",
        "target_id": partner_id,
        "target_name": partner.get("business_name", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Mock email notification
    user = await db.users.find_one({"id": partner.get("user_id")}, {"_id": 0, "password": 0})
    email_to = user.get("email", "unknown") if user else "unknown"
    logger.info(f"[EMAIL NOTIFICATION] Partner REJECTED — To: {email_to}, Business: {partner.get('business_name', '')}, Partner ID: {partner_id}")
    await db.email_notifications.insert_one({
        "id": str(uuid.uuid4()),
        "to": email_to,
        "subject": f"Update on your partner application for '{partner.get('business_name', '')}'",
        "body": f"We regret to inform you that your application for '{partner.get('business_name', '')}' has not been approved at this time. Please contact support for more details.",
        "type": "partner_rejected",
        "partner_id": partner_id,
        "status": "logged",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"message": "Partner rejected", "partner_id": partner_id, "email_sent_to": email_to}


@router.get("/flags")
async def get_content_flags(authorization: Optional[str] = Header(None)):
    await _require_admin(authorization)

    flags = await db.content_flags.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    return {"flags": flags}


@router.post("/flags/{flag_id}/resolve")
async def resolve_flag(flag_id: str, authorization: Optional[str] = Header(None)):
    admin = await _require_admin(authorization)

    flag = await db.content_flags.find_one({"id": flag_id})
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")

    await db.content_flags.update_one(
        {"id": flag_id},
        {"$set": {"status": "resolved", "resolved_by": admin["user_id"], "resolved_at": datetime.now(timezone.utc).isoformat()}}
    )

    await db.admin_activity.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": admin["user_id"],
        "action": "flag_resolved",
        "target_id": flag_id,
        "target_name": flag.get("content", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"message": "Flag resolved", "flag_id": flag_id}


@router.get("/activity")
async def get_admin_activity(authorization: Optional[str] = Header(None)):
    await _require_admin(authorization)

    activity = await db.admin_activity.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    return {"activity": activity}


@router.post("/seed")
async def seed_admin_user(authorization: Optional[str] = Header(None)):
    """Promote a user to admin role. Requires existing auth token."""
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    await db.users.update_one(
        {"id": user["user_id"]},
        {"$set": {"role": "admin"}}
    )

    return {"message": "User promoted to admin", "user_id": user["user_id"]}
