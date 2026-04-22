from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter(prefix="/api/landmarks", tags=["landmarks"])

LANDMARKS_DATA = [
    {"id": "lm-1", "name": "Jemaa el-Fnaa", "city": "Marrakech", "type": "MEDINA", "lat": 31.6258, "lng": -7.9891, "safety_level": "SAFE", "description": "The beating heart of Marrakech. A vast square and marketplace filled with storytellers, musicians, snake charmers, and food stalls.", "entry_fee": 0, "visit_duration": 120, "cover_image": "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=600", "tags": ["culture", "food", "shopping", "nightlife"], "rating": 4.7},
    {"id": "lm-2", "name": "Bahia Palace", "city": "Marrakech", "type": "PALACE", "lat": 31.6218, "lng": -7.9832, "safety_level": "SAFE", "description": "A stunning 19th-century palace with intricate Islamic and Moroccan architecture, beautiful gardens, and ornate tilework.", "entry_fee": 70, "visit_duration": 90, "cover_image": "https://images.unsplash.com/photo-1548017462-37c1e97e3541?w=600", "tags": ["history", "art", "photography"], "rating": 4.8},
    {"id": "lm-3", "name": "Koutoubia Mosque", "city": "Marrakech", "type": "MOSQUE", "lat": 31.6237, "lng": -7.9937, "safety_level": "SAFE", "description": "The largest mosque in Marrakech with a stunning 77-meter minaret visible from miles away. Gardens open to all visitors.", "entry_fee": 0, "visit_duration": 30, "cover_image": "https://images.unsplash.com/photo-1560095633-6858c8e34923?w=600", "tags": ["history", "photography", "culture"], "rating": 4.6},
    {"id": "lm-4", "name": "Jardin Majorelle", "city": "Marrakech", "type": "GARDEN", "lat": 31.6416, "lng": -8.0035, "safety_level": "SAFE", "description": "The iconic blue garden created by Jacques Majorelle and later owned by Yves Saint Laurent. Features exotic plants and a museum.", "entry_fee": 150, "visit_duration": 90, "cover_image": "https://images.unsplash.com/photo-1572698429673-bfb1fdaf0e7e?w=600", "tags": ["nature", "art", "photography", "relaxation"], "rating": 4.5},
    {"id": "lm-5", "name": "Saadian Tombs", "city": "Marrakech", "type": "MUSEUM", "lat": 31.6178, "lng": -7.9884, "safety_level": "SAFE", "description": "Royal necropolis dating from the Saadian dynasty with exquisite tilework and carved cedar wood.", "entry_fee": 70, "visit_duration": 45, "cover_image": "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=600", "tags": ["history", "art"], "rating": 4.4},
    {"id": "lm-6", "name": "Chouara Tannery", "city": "Fes", "type": "MARKET", "lat": 34.0662, "lng": -4.9737, "safety_level": "CAUTION", "description": "The oldest leather tannery in the world. Watch artisans dye leather in colorful stone vats using medieval methods.", "entry_fee": 20, "visit_duration": 60, "cover_image": "https://images.unsplash.com/photo-1545465531-d4a4d8e4f5b0?w=600", "tags": ["culture", "shopping", "photography"], "rating": 4.3},
    {"id": "lm-7", "name": "Bou Inania Madrasa", "city": "Fes", "type": "MOSQUE", "lat": 34.0623, "lng": -4.9814, "safety_level": "SAFE", "description": "A magnificent 14th-century Islamic college with stunning zellige tilework, carved stucco, and cedar wood.", "entry_fee": 30, "visit_duration": 45, "cover_image": "https://images.unsplash.com/photo-1565103451028-89f11edfeabc?w=600", "tags": ["history", "art", "culture"], "rating": 4.6},
    {"id": "lm-8", "name": "Blue Streets", "city": "Chefchaouen", "type": "MEDINA", "lat": 35.1688, "lng": -5.2684, "safety_level": "SAFE", "description": "The famous blue-washed streets of Chefchaouen's medina, one of the most photographed places in Morocco.", "entry_fee": 0, "visit_duration": 180, "cover_image": "https://images.unsplash.com/photo-1633518684551-3d36635c427a?w=600", "tags": ["photography", "culture", "relaxation"], "rating": 4.9},
    {"id": "lm-9", "name": "Hassan II Mosque", "city": "Casablanca", "type": "MOSQUE", "lat": 33.6086, "lng": -7.6322, "safety_level": "SAFE", "description": "The largest mosque in Africa with a 210m minaret. Built on the Atlantic coast with a glass floor revealing the ocean below.", "entry_fee": 130, "visit_duration": 90, "cover_image": "https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?w=600", "tags": ["history", "culture", "photography", "art"], "rating": 4.8},
    {"id": "lm-10", "name": "Erg Chebbi Dunes", "city": "Merzouga", "type": "MOUNTAIN", "lat": 31.1497, "lng": -3.9650, "safety_level": "CAUTION", "description": "Towering orange sand dunes rising up to 150m. Experience camel treks, desert camping, and stunning sunrises.", "entry_fee": 0, "visit_duration": 480, "cover_image": "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600", "tags": ["adventure", "nature", "photography"], "rating": 4.9},
    {"id": "lm-11", "name": "Kasbah of Ait Benhaddou", "city": "Ouarzazate", "type": "RUIN", "lat": 31.0472, "lng": -7.1299, "safety_level": "SAFE", "description": "UNESCO World Heritage ksar along the former caravan route. Featured in Gladiator and Game of Thrones.", "entry_fee": 10, "visit_duration": 120, "cover_image": "https://images.unsplash.com/photo-1545041045-a4c62b4d0806?w=600", "tags": ["history", "photography", "adventure"], "rating": 4.7},
    {"id": "lm-12", "name": "Essaouira Medina", "city": "Essaouira", "type": "MEDINA", "lat": 31.5085, "lng": -9.7700, "safety_level": "SAFE", "description": "A laid-back coastal medina with Portuguese fortifications, art galleries, and fresh seafood by the harbor.", "entry_fee": 0, "visit_duration": 180, "cover_image": "https://images.pexels.com/photos/10460823/pexels-photo-10460823.jpeg?auto=compress&w=600", "tags": ["relaxation", "food", "art", "culture"], "rating": 4.6},
]


@router.get("")
async def get_landmarks(city: Optional[str] = None, type: Optional[str] = None, safety: Optional[str] = None, search: Optional[str] = None):
    results = LANDMARKS_DATA[:]
    if city:
        results = [l for l in results if l["city"].lower() == city.lower()]
    if type:
        results = [l for l in results if l["type"] == type]
    if safety:
        results = [l for l in results if l["safety_level"] == safety]
    if search:
        q = search.lower()
        results = [l for l in results if q in l["name"].lower() or q in l["description"].lower() or q in l["city"].lower()]
    return {"landmarks": results}


@router.get("/{landmark_id}")
async def get_landmark(landmark_id: str):
    for l in LANDMARKS_DATA:
        if l["id"] == landmark_id:
            return l
    raise HTTPException(status_code=404, detail="Landmark not found")
