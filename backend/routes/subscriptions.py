from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional
from datetime import datetime, timezone
import uuid
import json
import logging
import stripe as stripe_lib

from database import db
from auth import get_current_user
from models import CheckoutRequest
from config import STRIPE_API_KEY
from subscriptions import (
    TravelerPlan, PartnerPlan, PLAN_AMOUNTS,
    TRAVELER_LIMITS, PARTNER_LIMITS, TRAVELER_PLAN_INFO, PARTNER_PLAN_INFO,
    PlanAccessChecker,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["subscriptions"])

plan_checker = PlanAccessChecker(db)

# Configure Stripe
stripe_lib.api_key = STRIPE_API_KEY


@router.get("/api/subscription/plans")
async def get_plans(plan_type: str = "traveler"):
    if plan_type == "partner":
        return {"plans": PARTNER_PLAN_INFO}
    return {"plans": TRAVELER_PLAN_INFO}


@router.get("/api/subscription/status")
async def get_subscription_status(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        return {
            "is_active": True,
            "plan_type": "traveler",
            "plan_id": TravelerPlan.EXPLORER,
            "limits": TRAVELER_LIMITS[TravelerPlan.EXPLORER],
            "current_usage": {},
            "authenticated": False
        }

    full_user = await db.users.find_one({"id": user["user_id"]}, {"_id": 0})
    if not full_user:
        raise HTTPException(status_code=404, detail="User not found")

    pt = full_user.get("plan_type", "traveler")
    pid = full_user.get("plan_id", TravelerPlan.EXPLORER)

    if pt == "partner":
        limits = PARTNER_LIMITS.get(pid, PARTNER_LIMITS[PartnerPlan.FREE_LISTING])
    else:
        limits = TRAVELER_LIMITS.get(pid, TRAVELER_LIMITS[TravelerPlan.EXPLORER])

    usage = await plan_checker.get_all_usage(user["user_id"])

    return {
        "is_active": full_user.get("subscription_status") == "active",
        "plan_type": pt,
        "plan_id": pid,
        "limits": limits,
        "current_usage": usage,
        "renewal_date": full_user.get("subscription_end"),
        "authenticated": True
    }


@router.post("/api/subscription/checkout")
async def create_checkout_session(request: Request, data: CheckoutRequest, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    if data.plan_type == "traveler":
        if data.plan_id not in [p.value for p in TravelerPlan]:
            raise HTTPException(status_code=400, detail="Invalid traveler plan")
        plan_enum = TravelerPlan(data.plan_id)
        amount = PLAN_AMOUNTS.get(plan_enum, 0)
        plan_info = TRAVELER_PLAN_INFO.get(plan_enum, {})
    elif data.plan_type == "partner":
        if data.plan_id not in [p.value for p in PartnerPlan]:
            raise HTTPException(status_code=400, detail="Invalid partner plan")
        plan_enum = PartnerPlan(data.plan_id)
        amount = PLAN_AMOUNTS.get(plan_enum, 0)
        plan_info = PARTNER_PLAN_INFO.get(plan_enum, {})
    else:
        raise HTTPException(status_code=400, detail="Invalid plan type")

    if amount == 0:
        await db.users.update_one(
            {"id": user["user_id"]},
            {"$set": {
                "plan_type": data.plan_type,
                "plan_id": data.plan_id,
                "subscription_status": "active"
            }}
        )
        return {"success": True, "message": "Switched to free plan"}

    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    success_url = f"{data.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/subscription/cancel"

    try:
        amount_in_cents = int(amount * 100)
        metadata = {
            "user_id": user["user_id"],
            "plan_type": data.plan_type,
            "plan_id": data.plan_id,
            "plan_name": plan_info.get("name", data.plan_id),
            "webhook_url": webhook_url,
        }
        session = stripe_lib.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "mad",
                    "product_data": {"name": "Payment"},
                    "unit_amount": amount_in_cents,
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
        )

        await db.payment_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": session.id,
            "user_id": user["user_id"],
            "amount": amount,
            "currency": "MAD",
            "plan_type": data.plan_type,
            "plan_id": data.plan_id,
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        return {"url": session.url, "session_id": session.id}
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="Payment service unavailable")


@router.get("/api/subscription/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    try:
        session = stripe_lib.checkout.Session.retrieve(session_id)

        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        if transaction.get("payment_status") == "pending" and session.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": "paid",
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }}
            )

            await db.users.update_one(
                {"id": transaction["user_id"]},
                {"$set": {
                    "plan_type": transaction["plan_type"],
                    "plan_id": transaction["plan_id"],
                    "subscription_status": "active",
                    "subscription_start": datetime.now(timezone.utc).isoformat(),
                    "stripe_session_id": session_id
                }}
            )
            logger.info(f"Subscription activated for user {transaction['user_id']}: {transaction['plan_id']}")

        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "amount": session.amount_total,
            "currency": session.currency,
            "plan_type": transaction.get("plan_type"),
            "plan_id": transaction.get("plan_id")
        }
    except Exception as e:
        logger.error(f"Status check error: {e}")
        raise HTTPException(status_code=500, detail="Unable to check payment status")


@router.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()

    try:
        event = json.loads(body.decode("utf-8"))
        event_type = event.get("type", "")

        if event_type == "checkout.session.completed":
            session_data = event["data"]["object"]
            session_id = session_data.get("id")
            payment_status = session_data.get("payment_status")

            if payment_status == "paid":
                transaction = await db.payment_transactions.find_one({"session_id": session_id})
                if transaction and transaction.get("payment_status") == "pending":
                    await db.payment_transactions.update_one(
                        {"session_id": session_id},
                        {"$set": {
                            "payment_status": "paid",
                            "completed_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    await db.users.update_one(
                        {"id": transaction["user_id"]},
                        {"$set": {
                            "plan_type": transaction["plan_type"],
                            "plan_id": transaction["plan_id"],
                            "subscription_status": "active",
                            "subscription_start": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    logger.info(f"Webhook: Subscription activated for user {transaction['user_id']}")

        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True, "error": str(e)}


@router.get("/api/usage/check/{feature}")
async def check_feature_usage(feature: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        check = await plan_checker.check_access("anonymous", feature)
    else:
        check = await plan_checker.check_access(user["user_id"], feature)
    return check.dict()


@router.post("/api/usage/track/{feature}")
async def track_feature_usage(feature: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required for usage tracking")
    check = await plan_checker.use_feature(user["user_id"], feature)
    return check.dict()
