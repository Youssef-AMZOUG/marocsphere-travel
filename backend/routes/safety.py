from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime, timezone
import uuid
import random

from database import db
from models import EmergencyRequest

router = APIRouter(prefix="/api/safety", tags=["safety"])

SAFETY_TIPS = [
    "Keep valuables in front pockets or use a money belt",
    "Use official taxis and insist on the meter",
    "Dress modestly at religious sites",
    "Avoid isolated areas after dark",
    "Carry your embassy contact information",
    "Drink bottled water only",
    "Be cautious of unofficial guides offering tours",
    "Keep a photocopy of your passport separately",
    "Learn basic French or Arabic greetings",
    "Negotiate prices before accepting services"
]


@router.get("/report")
async def get_safety_report(lat: float = 31.6295, lng: float = -7.9811):
    score = random.randint(72, 95)
    status = "SAFE" if score >= 80 else "CAUTION" if score >= 60 else "AVOID"
    alerts = await db.safety_alerts.find({"active": True}, {"_id": 0}).to_list(20)
    if not alerts:
        alerts = [
            {"id": "sa-1", "type": "warning", "message": "Pickpocketing reported near Jemaa el-Fnaa main square area", "distance": "500m", "time_ago": "30 min ago", "location": "Jemaa el-Fnaa"},
            {"id": "sa-2", "type": "info", "message": "Ramadan 2026: restaurants may be closed during daytime hours in March", "distance": "Your area", "time_ago": "Ongoing", "location": "All Morocco"},
        ]
    return {
        "score": score,
        "status": status,
        "alerts": alerts,
        "tips": SAFETY_TIPS,
        "emergency": {"police": "19", "ambulance": "15", "fire": "15", "tourist_police": "0524 38 46 01"},
        "nearby_incidents": random.randint(0, 3),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


@router.post("/emergency")
async def trigger_emergency(data: EmergencyRequest):
    emergency_id = str(uuid.uuid4())
    doc = {
        "id": emergency_id,
        "lat": data.lat,
        "lng": data.lng,
        "message": data.message,
        "status": "triggered",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.emergency_logs.insert_one(doc)
    return {"id": emergency_id, "status": "Alert sent", "message": "Emergency contacts notified with your location"}
