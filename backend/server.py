from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os
import logging

from config import CORS_ORIGINS
from database import client

# Import routers
from routes.auth import router as auth_router
from routes.chat import router as chat_router
from routes.itinerary import router as itinerary_router
from routes.landmarks import router as landmarks_router
from routes.safety import router as safety_router
from routes.destinations import router as destinations_router
from routes.subscriptions import router as subscriptions_router
from routes.partners import router as partners_router
from routes.admin import router as admin_router
from routes.reviews import router as reviews_router

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="MarocSphere API", version="2.0.0")

# Mount all routers
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(itinerary_router)
app.include_router(landmarks_router)
app.include_router(safety_router)
app.include_router(destinations_router)
app.include_router(subscriptions_router)
app.include_router(partners_router)
app.include_router(admin_router)
app.include_router(reviews_router)


@app.get("/api")
async def root():
    return {"message": "MarocSphere API", "version": "2.0.0"}


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
