# ─── MarocSphere Subscription System ───────────────────
# Plans, Feature Gates, and Usage Tracking

from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

# ─── Plan Definitions ──────────────────────────────────

class TravelerPlan(str, Enum):
    EXPLORER = "explorer"      # Free
    VOYAGER = "voyager"        # 99 MAD/month
    NOMADE = "nomade"          # 249 MAD/month

class PartnerPlan(str, Enum):
    FREE_LISTING = "free_listing"     # Free
    PARTNER = "partner"               # 490 MAD/month
    PARTNER_PRO = "partner_pro"       # 1490 MAD/month

# Stripe Price IDs (to be configured in Stripe Dashboard)
STRIPE_PRICES = {
    # Traveler Plans
    TravelerPlan.VOYAGER: "price_voyager_99_mad",
    TravelerPlan.NOMADE: "price_nomade_249_mad",
    # Partner Plans
    PartnerPlan.PARTNER: "price_partner_490_mad",
    PartnerPlan.PARTNER_PRO: "price_partner_pro_1490_mad",
}

# Plan Amounts in MAD (for custom checkout)
PLAN_AMOUNTS = {
    TravelerPlan.EXPLORER: 0,
    TravelerPlan.VOYAGER: 99.00,
    TravelerPlan.NOMADE: 249.00,
    PartnerPlan.FREE_LISTING: 0,
    PartnerPlan.PARTNER: 490.00,
    PartnerPlan.PARTNER_PRO: 1490.00,
}

# ─── Feature Limits per Plan ───────────────────────────

TRAVELER_LIMITS = {
    TravelerPlan.EXPLORER: {
        "ai_itinerary_per_day": 1,
        "ai_itinerary_max_days": 5,
        "ai_chat_messages_per_day": 5,
        "saved_trips_max": 2,
        "ar_scans_per_day": 5,
        "offline_maps": False,
        "priority_support": False,
        "detailed_safety": False,
        "booking_discount": 0,
        "partner_chat": False,
    },
    TravelerPlan.VOYAGER: {
        "ai_itinerary_per_day": 5,
        "ai_itinerary_max_days": 10,
        "ai_chat_messages_per_day": 50,
        "saved_trips_max": 10,
        "ar_scans_per_day": 20,
        "offline_maps": True,
        "priority_support": False,
        "detailed_safety": True,
        "booking_discount": 5,  # 5%
        "partner_chat": True,
    },
    TravelerPlan.NOMADE: {
        "ai_itinerary_per_day": -1,  # Unlimited
        "ai_itinerary_max_days": 14,
        "ai_chat_messages_per_day": -1,  # Unlimited
        "saved_trips_max": -1,  # Unlimited
        "ar_scans_per_day": -1,  # Unlimited
        "offline_maps": True,
        "priority_support": True,
        "detailed_safety": True,
        "booking_discount": 10,  # 10%
        "partner_chat": True,
    },
}

PARTNER_LIMITS = {
    PartnerPlan.FREE_LISTING: {
        "profile_visible": True,
        "bookings_per_month": 5,
        "photos_max": 5,
        "analytics_basic": True,
        "analytics_advanced": False,
        "calendar_sync": False,
        "passport_of_good": False,
        "featured_listing": False,
        "commission_rate": 15,  # 15%
        "payout_frequency": "monthly",
    },
    PartnerPlan.PARTNER: {
        "profile_visible": True,
        "bookings_per_month": -1,  # Unlimited
        "photos_max": 20,
        "analytics_basic": True,
        "analytics_advanced": True,
        "calendar_sync": True,
        "passport_of_good": True,
        "featured_listing": False,
        "commission_rate": 10,  # 10%
        "payout_frequency": "weekly",
    },
    PartnerPlan.PARTNER_PRO: {
        "profile_visible": True,
        "bookings_per_month": -1,  # Unlimited
        "photos_max": 50,
        "analytics_basic": True,
        "analytics_advanced": True,
        "calendar_sync": True,
        "passport_of_good": True,
        "featured_listing": True,
        "commission_rate": 7,  # 7%
        "payout_frequency": "instant",
    },
}

# ─── Pydantic Models ───────────────────────────────────

class SubscriptionCreate(BaseModel):
    plan_type: str  # "traveler" or "partner"
    plan_id: str    # The plan enum value

class SubscriptionStatus(BaseModel):
    is_active: bool
    plan_type: str
    plan_id: str
    limits: Dict[str, Any]
    current_usage: Dict[str, int]
    renewal_date: Optional[str]
    stripe_customer_id: Optional[str]

class UsageCheck(BaseModel):
    feature: str
    allowed: bool
    current: int
    limit: int
    message: str

# ─── Usage Tracking Keys ───────────────────────────────

def get_daily_key(user_id: str, feature: str) -> str:
    """Generate a key for daily usage tracking"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"usage:{user_id}:{feature}:{today}"

def get_monthly_key(user_id: str, feature: str) -> str:
    """Generate a key for monthly usage tracking"""
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    return f"usage:{user_id}:{feature}:{month}"

# ─── Feature Access Checker ────────────────────────────

class PlanAccessChecker:
    """
    The core middleware for checking plan access.
    Call this from EVERY feature endpoint.
    """
    
    def __init__(self, db):
        self.db = db
    
    async def get_user_plan(self, user_id: str) -> tuple:
        """Get user's current plan type and ID"""
        user = await self.db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            return "traveler", TravelerPlan.EXPLORER
        
        plan_type = user.get("plan_type", "traveler")
        if plan_type == "partner":
            plan_id = user.get("plan_id", PartnerPlan.FREE_LISTING)
        else:
            plan_id = user.get("plan_id", TravelerPlan.EXPLORER)
        
        return plan_type, plan_id
    
    async def get_feature_limit(self, user_id: str, feature: str) -> int:
        """Get the limit for a specific feature based on user's plan"""
        plan_type, plan_id = await self.get_user_plan(user_id)
        
        if plan_type == "partner":
            limits = PARTNER_LIMITS.get(plan_id, PARTNER_LIMITS[PartnerPlan.FREE_LISTING])
        else:
            limits = TRAVELER_LIMITS.get(plan_id, TRAVELER_LIMITS[TravelerPlan.EXPLORER])
        
        return limits.get(feature, 0)
    
    async def get_current_usage(self, user_id: str, feature: str, period: str = "daily") -> int:
        """Get current usage count for a feature"""
        if period == "daily":
            key = get_daily_key(user_id, feature)
        else:
            key = get_monthly_key(user_id, feature)
        
        usage_doc = await self.db.usage_tracking.find_one({"key": key})
        return usage_doc.get("count", 0) if usage_doc else 0
    
    async def increment_usage(self, user_id: str, feature: str, period: str = "daily") -> int:
        """Increment usage count and return new value"""
        if period == "daily":
            key = get_daily_key(user_id, feature)
            expires = datetime.now(timezone.utc) + timedelta(days=1)
        else:
            key = get_monthly_key(user_id, feature)
            expires = datetime.now(timezone.utc) + timedelta(days=31)
        
        result = await self.db.usage_tracking.find_one_and_update(
            {"key": key},
            {
                "$inc": {"count": 1},
                "$set": {"expires_at": expires.isoformat(), "user_id": user_id, "feature": feature}
            },
            upsert=True,
            return_document=True
        )
        return result.get("count", 1)
    
    async def check_access(self, user_id: str, feature: str, period: str = "daily") -> UsageCheck:
        """
        THE MAIN FUNCTION - Check if user can access a feature
        Returns UsageCheck with allowed status and details
        """
        limit = await self.get_feature_limit(user_id, feature)
        current = await self.get_current_usage(user_id, feature, period)
        
        # -1 means unlimited
        if limit == -1:
            return UsageCheck(
                feature=feature,
                allowed=True,
                current=current,
                limit=-1,
                message="Unlimited access"
            )
        
        # Boolean features (True/False)
        if isinstance(limit, bool):
            return UsageCheck(
                feature=feature,
                allowed=limit,
                current=0,
                limit=1 if limit else 0,
                message="Feature available" if limit else "Upgrade to access this feature"
            )
        
        # Numeric limits
        allowed = current < limit
        if allowed:
            message = f"{limit - current} remaining today"
        else:
            plan_type, plan_id = await self.get_user_plan(user_id)
            if plan_type == "traveler" and plan_id == TravelerPlan.EXPLORER:
                message = f"Daily limit reached. Upgrade to Voyager for more!"
            elif plan_type == "traveler" and plan_id == TravelerPlan.VOYAGER:
                message = f"Daily limit reached. Upgrade to Nomade for unlimited!"
            else:
                message = f"Daily limit of {limit} reached"
        
        return UsageCheck(
            feature=feature,
            allowed=allowed,
            current=current,
            limit=limit,
            message=message
        )
    
    async def use_feature(self, user_id: str, feature: str, period: str = "daily") -> UsageCheck:
        """Check access AND increment usage if allowed"""
        check = await self.check_access(user_id, feature, period)
        if check.allowed:
            new_count = await self.increment_usage(user_id, feature, period)
            check.current = new_count
            if check.limit > 0:
                check.message = f"{check.limit - new_count} remaining today"
        return check
    
    async def get_all_usage(self, user_id: str) -> Dict[str, Dict]:
        """Get all usage stats for a user"""
        plan_type, plan_id = await self.get_user_plan(user_id)
        
        if plan_type == "partner":
            limits = PARTNER_LIMITS.get(plan_id, PARTNER_LIMITS[PartnerPlan.FREE_LISTING])
        else:
            limits = TRAVELER_LIMITS.get(plan_id, TRAVELER_LIMITS[TravelerPlan.EXPLORER])
        
        usage = {}
        for feature, limit in limits.items():
            if isinstance(limit, int) and limit != 0:
                period = "monthly" if "month" in feature else "daily"
                current = await self.get_current_usage(user_id, feature, period)
                usage[feature] = {
                    "current": current,
                    "limit": limit,
                    "unlimited": limit == -1
                }
            elif isinstance(limit, bool):
                usage[feature] = {
                    "enabled": limit
                }
        
        return usage

# ─── Plan Display Info ─────────────────────────────────

TRAVELER_PLAN_INFO = {
    TravelerPlan.EXPLORER: {
        "name": "Explorer",
        "name_fr": "Explorateur",
        "name_ar": "مستكشف",
        "price": 0,
        "currency": "MAD",
        "period": "month",
        "badge_color": "#6B7280",
        "features": [
            "1 AI itinerary per day",
            "5 AI chat messages per day",
            "2 saved trips",
            "5 AR scans per day",
            "Basic safety info",
        ],
        "features_fr": [
            "1 itinéraire IA par jour",
            "5 messages IA par jour",
            "2 voyages sauvegardés",
            "5 scans AR par jour",
            "Infos sécurité de base",
        ],
    },
    TravelerPlan.VOYAGER: {
        "name": "Voyager",
        "name_fr": "Voyageur",
        "name_ar": "مسافر",
        "price": 99,
        "currency": "MAD",
        "period": "month",
        "badge_color": "#E2725B",
        "popular": True,
        "features": [
            "5 AI itineraries per day",
            "50 AI chat messages per day",
            "10 saved trips",
            "20 AR scans per day",
            "Offline maps",
            "Detailed safety alerts",
            "5% booking discount",
            "Direct partner chat",
        ],
        "features_fr": [
            "5 itinéraires IA par jour",
            "50 messages IA par jour",
            "10 voyages sauvegardés",
            "20 scans AR par jour",
            "Cartes hors ligne",
            "Alertes sécurité détaillées",
            "5% de réduction sur les réservations",
            "Chat direct avec partenaires",
        ],
    },
    TravelerPlan.NOMADE: {
        "name": "Nomade",
        "name_fr": "Nomade",
        "name_ar": "رحالة",
        "price": 249,
        "currency": "MAD",
        "period": "month",
        "badge_color": "#D4A017",
        "features": [
            "Unlimited AI itineraries",
            "Unlimited AI chat",
            "Unlimited saved trips",
            "Unlimited AR scans",
            "Offline maps",
            "Priority support",
            "10% booking discount",
            "Direct partner chat",
            "Early access to new features",
        ],
        "features_fr": [
            "Itinéraires IA illimités",
            "Chat IA illimité",
            "Voyages sauvegardés illimités",
            "Scans AR illimités",
            "Cartes hors ligne",
            "Support prioritaire",
            "10% de réduction sur les réservations",
            "Chat direct avec partenaires",
            "Accès anticipé aux nouvelles fonctionnalités",
        ],
    },
}

PARTNER_PLAN_INFO = {
    PartnerPlan.FREE_LISTING: {
        "name": "Free Listing",
        "name_fr": "Inscription Gratuite",
        "name_ar": "قائمة مجانية",
        "price": 0,
        "currency": "MAD",
        "period": "month",
        "badge_color": "#6B7280",
        "features": [
            "Basic profile visibility",
            "5 bookings per month",
            "5 photos",
            "Basic analytics",
            "15% commission",
            "Monthly payouts",
        ],
    },
    PartnerPlan.PARTNER: {
        "name": "Partner",
        "name_fr": "Partenaire",
        "name_ar": "شريك",
        "price": 490,
        "currency": "MAD",
        "period": "month",
        "badge_color": "#E2725B",
        "popular": True,
        "features": [
            "Full profile visibility",
            "Unlimited bookings",
            "20 photos",
            "Advanced analytics",
            "Calendar sync",
            "Passport of Good badge",
            "10% commission",
            "Weekly payouts",
        ],
    },
    PartnerPlan.PARTNER_PRO: {
        "name": "Partner Pro",
        "name_fr": "Partenaire Pro",
        "name_ar": "شريك محترف",
        "price": 1490,
        "currency": "MAD",
        "period": "month",
        "badge_color": "#D4A017",
        "features": [
            "Full profile visibility",
            "Unlimited bookings",
            "50 photos",
            "Advanced analytics",
            "Calendar sync",
            "Passport of Good badge",
            "Featured listing",
            "7% commission",
            "Instant payouts",
        ],
    },
}
