from fastapi import APIRouter

router = APIRouter(prefix="/api/destinations", tags=["destinations"])

DESTINATIONS = [
    {"id": "dest-1", "name": "Marrakech", "subtitle": "The Red City", "description": "A vibrant maze of souks, palaces, and gardens where ancient traditions meet modern luxury.", "lat": 31.6295, "lng": -7.9811, "image": "https://images.unsplash.com/photo-1628790891451-024e881c49e2?w=600", "safety": "SAFE", "landmarks_count": 45, "rating": 4.8, "best_time": "Oct-Apr"},
    {"id": "dest-2", "name": "Fes", "subtitle": "The Spiritual Capital", "description": "Home to the world's oldest university and the largest car-free urban zone. Step back in time in its medieval medina.", "lat": 34.0181, "lng": -5.0078, "image": "https://images.unsplash.com/photo-1706794440887-19f5a51449da?w=600", "safety": "SAFE", "landmarks_count": 38, "rating": 4.7, "best_time": "Mar-May, Sep-Nov"},
    {"id": "dest-3", "name": "Chefchaouen", "subtitle": "The Blue Pearl", "description": "A dreamlike hilltop town painted in every shade of blue, nestled in the Rif Mountains.", "lat": 35.1688, "lng": -5.2684, "image": "https://images.unsplash.com/photo-1727860103424-601fe499e124?w=600", "safety": "SAFE", "landmarks_count": 15, "rating": 4.9, "best_time": "Mar-Jun, Sep-Nov"},
    {"id": "dest-4", "name": "Essaouira", "subtitle": "The Wind City", "description": "A laid-back coastal gem with Portuguese fortifications, art galleries, and the freshest seafood.", "lat": 31.5085, "lng": -9.7700, "image": "https://images.pexels.com/photos/6663014/pexels-photo-6663014.jpeg?auto=compress&w=600", "safety": "SAFE", "landmarks_count": 12, "rating": 4.6, "best_time": "Apr-Oct"},
    {"id": "dest-5", "name": "Merzouga", "subtitle": "Gateway to the Sahara", "description": "Where the Erg Chebbi dunes rise 150m into the sky. Experience camel treks and desert camping under the stars.", "lat": 31.1497, "lng": -3.9650, "image": "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600", "safety": "CAUTION", "landmarks_count": 5, "rating": 4.9, "best_time": "Oct-Apr"},
    {"id": "dest-6", "name": "Ouarzazate", "subtitle": "Hollywood of Africa", "description": "The film capital of Morocco, gateway to the Draa Valley and home to stunning kasbahs.", "lat": 30.9178, "lng": -6.8936, "image": "https://images.pexels.com/photos/17399231/pexels-photo-17399231.jpeg?auto=compress&w=600", "safety": "SAFE", "landmarks_count": 8, "rating": 4.5, "best_time": "Mar-May, Sep-Nov"},
]


@router.get("")
async def get_destinations():
    return {"destinations": DESTINATIONS}
