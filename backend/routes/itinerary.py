from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from datetime import datetime, timezone
import uuid
import json
import logging

from emergentintegrations.llm.chat import LlmChat, UserMessage
from database import db
from auth import get_current_user
from models import ItineraryRequest
from config import EMERGENT_LLM_KEY

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/itineraries", tags=["itineraries"])


def build_fallback_itinerary(data):
    dest_activities = {
        "Marrakech": [
            {"time_slot": "morning", "start_time": "09:00", "title": "Explore Jemaa el-Fnaa", "description": "Start your day at the legendary main square. Watch snake charmers, listen to storytellers, and soak in the atmosphere.", "location": "Jemaa el-Fnaa", "duration_min": 120, "cost_mad": 0, "tip": "Go early to avoid the midday heat and biggest crowds."},
            {"time_slot": "afternoon", "start_time": "14:00", "title": "Bahia Palace Visit", "description": "Marvel at the stunning 19th-century palace with intricate zellige tilework and serene gardens.", "location": "Bahia Palace", "duration_min": 90, "cost_mad": 70, "tip": "The interior courtyard is most photogenic in afternoon light."},
            {"time_slot": "evening", "start_time": "18:00", "title": "Sunset at Cafe de France", "description": "Watch the sun set over the medina from this iconic rooftop terrace overlooking the square.", "location": "Jemaa el-Fnaa", "duration_min": 90, "cost_mad": 80, "tip": "Order a traditional mint tea and enjoy the call to prayer at sunset."},
            {"time_slot": "morning", "start_time": "09:30", "title": "Jardin Majorelle", "description": "Visit the famous blue garden created by Jacques Majorelle and later restored by Yves Saint Laurent.", "location": "Jardin Majorelle", "duration_min": 90, "cost_mad": 150, "tip": "Arrive when it opens to enjoy the gardens without crowds."},
            {"time_slot": "afternoon", "start_time": "13:30", "title": "Souk Shopping Adventure", "description": "Navigate the labyrinthine souks for spices, leather goods, ceramics, and handmade textiles.", "location": "Medina Souks", "duration_min": 180, "cost_mad": 300, "tip": "Always negotiate — start at 30% of the asking price and settle around 50-60%."},
            {"time_slot": "evening", "start_time": "19:00", "title": "Traditional Moroccan Dinner", "description": "Enjoy an authentic multi-course dinner with tagine, couscous, and pastilla at a traditional riad.", "location": "Riad Restaurant", "duration_min": 120, "cost_mad": 250, "tip": "Try the lamb tagine with prunes and almonds — a Marrakech specialty."},
            {"time_slot": "morning", "start_time": "08:00", "title": "Koutoubia Mosque Gardens", "description": "Start with a peaceful walk through the gardens surrounding Marrakech's largest mosque.", "location": "Koutoubia Mosque", "duration_min": 45, "cost_mad": 0, "tip": "Non-Muslims cannot enter the mosque but the gardens and exterior are beautiful."},
            {"time_slot": "afternoon", "start_time": "14:00", "title": "Saadian Tombs", "description": "Discover the ornate royal necropolis dating back to the 16th-century Saadian dynasty.", "location": "Saadian Tombs", "duration_min": 60, "cost_mad": 70, "tip": "The Hall of Twelve Columns is the most impressive chamber."},
            {"time_slot": "evening", "start_time": "17:30", "title": "Hammam Experience", "description": "Relax at a traditional Moroccan bathhouse for an authentic scrub and steam session.", "location": "Heritage Spa", "duration_min": 120, "cost_mad": 400, "tip": "Bring your own towel and flip-flops for comfort."},
        ],
        "Fes": [
            {"time_slot": "morning", "start_time": "09:00", "title": "Fes el-Bali Medina Walk", "description": "Enter the world's largest car-free urban area through the iconic Blue Gate (Bab Boujloud).", "location": "Bab Boujloud", "duration_min": 180, "cost_mad": 0, "tip": "Hire an official guide at the gate — the medina's 9,400 streets are a real maze."},
            {"time_slot": "afternoon", "start_time": "14:00", "title": "Chouara Tannery", "description": "Watch artisans dye leather using medieval methods in colorful stone vats.", "location": "Chouara Tannery", "duration_min": 60, "cost_mad": 20, "tip": "Accept the sprig of mint offered at the entrance — you'll need it for the smell."},
            {"time_slot": "evening", "start_time": "19:00", "title": "Dinner at Fez Cafe", "description": "Enjoy rooftop dining with panoramic views of the medina under the stars.", "location": "Fez Cafe", "duration_min": 120, "cost_mad": 200, "tip": "Try the pastilla — Fes is famous for this sweet-savory pigeon pie."},
        ],
    }
    activities = dest_activities.get(data.destination, dest_activities["Marrakech"])
    days = []
    act_idx = 0
    for d in range(1, data.duration + 1):
        day_acts = []
        for slot in ["morning", "afternoon", "evening"]:
            act = activities[act_idx % len(activities)].copy()
            act["time_slot"] = slot
            day_acts.append(act)
            act_idx += 1
        days.append({
            "day_number": d,
            "theme": f"Day {d} Exploration" if d > 1 else "Arrival & First Impressions",
            "activities": day_acts,
            "travel_notes": "Most sites are walkable within the medina. Use petit taxis for longer distances.",
            "safety_tip": "Keep valuables secure in the medina and be aware of your surroundings."
        })
    budget_map = {
        "budget": {"accommodation": {"min": 200, "max": 400}, "food": {"min": 150, "max": 300}, "transport": {"min": 30, "max": 80}, "activities": {"min": 100, "max": 300}, "total": {"min": 480, "max": 1080}},
        "midrange": {"accommodation": {"min": 500, "max": 1000}, "food": {"min": 250, "max": 500}, "transport": {"min": 50, "max": 150}, "activities": {"min": 200, "max": 500}, "total": {"min": 1000, "max": 2150}},
        "luxury": {"accommodation": {"min": 1500, "max": 3000}, "food": {"min": 500, "max": 1000}, "transport": {"min": 150, "max": 400}, "activities": {"min": 500, "max": 1200}, "total": {"min": 2650, "max": 5600}},
    }
    return {
        "title": f"{data.duration}-Day {data.destination} Adventure",
        "days": days,
        "budget_estimate": budget_map.get(data.budget, budget_map["midrange"]),
        "packing_list": ["Comfortable walking shoes", "Sun hat & sunscreen", "Light breathable layers", "Scarf for mosque visits", "Reusable water bottle", "Power adapter (Type C/E)", "Small daypack"],
        "cultural_notes": [
            "Dress modestly, especially at religious sites — cover shoulders and knees",
            "Always ask before photographing people",
            "Bargain respectfully in souks — it's expected and part of the culture",
            "Remove shoes before entering mosques and some riads",
            "Tipping (10-15%) is appreciated in restaurants"
        ],
        "emergency_info": {"police": "19", "ambulance": "15", "nearest_hospital": "CHU Mohammed VI"}
    }


@router.post("/generate")
async def generate_itinerary(data: ItineraryRequest, authorization: Optional[str] = Header(None)):
    itinerary_data = None

    try:
        prompt = f"""Create a {data.duration}-day itinerary for {data.destination}, Morocco.
Traveler: {data.traveler_type}. Interests: {', '.join(data.interests)}. Budget: {data.budget}. Start: {data.start_date}.

Respond ONLY with JSON:
{{"title":"string","days":[{{"day_number":1,"theme":"string","activities":[{{"time_slot":"morning|afternoon|evening","start_time":"HH:MM","title":"string","description":"string","location":"string","duration_min":90,"cost_mad":0,"tip":"string"}}],"travel_notes":"string","safety_tip":"string"}}],"budget_estimate":{{"accommodation":{{"min":0,"max":0}},"food":{{"min":0,"max":0}},"transport":{{"min":0,"max":0}},"activities":{{"min":0,"max":0}},"total":{{"min":0,"max":0}}}},"packing_list":["string"],"cultural_notes":["string"],"emergency_info":{{"police":"19","ambulance":"15","nearest_hospital":"string"}}}}
All costs in MAD."""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"itinerary-{uuid.uuid4()}",
            system_message="You are an expert Moroccan travel planner. Always respond with valid JSON only.",
        ).with_model("anthropic", "claude-sonnet-4-6")

        user_message = UserMessage(text=prompt)
        raw_reply = await chat.send_message(user_message)

        clean = raw_reply.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
            clean = clean.rsplit("```", 1)[0]
        itinerary_data = json.loads(clean)
    except Exception as e:
        logger.warning(f"AI generation failed, using fallback: {e}")
        itinerary_data = build_fallback_itinerary(data)

    itinerary_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    user = await get_current_user(authorization)
    user_id = user["user_id"] if user else "anonymous"

    doc = {
        "id": itinerary_id,
        "user_id": user_id,
        "destination": data.destination,
        "duration": data.duration,
        "traveler_type": data.traveler_type,
        "interests": data.interests,
        "budget": data.budget,
        "start_date": data.start_date,
        "status": "PLANNED",
        "data": itinerary_data,
        "created_at": now
    }
    await db.itineraries.insert_one(doc)

    return {"id": itinerary_id, "itinerary": itinerary_data}


@router.get("")
async def get_itineraries(authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    query = {}
    if user:
        query["user_id"] = user["user_id"]
    itineraries = await db.itineraries.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"itineraries": itineraries}


@router.get("/{itinerary_id}")
async def get_itinerary(itinerary_id: str):
    it = await db.itineraries.find_one({"id": itinerary_id}, {"_id": 0})
    if not it:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return it


@router.delete("/{itinerary_id}")
async def delete_itinerary(itinerary_id: str):
    result = await db.itineraries.delete_one({"id": itinerary_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return {"message": "Deleted"}
