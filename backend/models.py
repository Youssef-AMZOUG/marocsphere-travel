from pydantic import BaseModel, Field
from typing import List, Optional


class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    account_role: str = "client"
    business_name: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class ChatMessageRequest(BaseModel):
    content: str
    session_id: Optional[str] = None


class ItineraryRequest(BaseModel):
    destination: str
    duration: int = Field(ge=1, le=14)
    traveler_type: str
    interests: List[str]
    budget: str
    start_date: str


class EmergencyRequest(BaseModel):
    lat: float
    lng: float
    message: Optional[str] = None


class CheckoutRequest(BaseModel):
    plan_type: str
    plan_id: str
    origin_url: str


class PartnerRegister(BaseModel):
    name: str
    email: str
    password: str
    phone: str
    business_name: str
    partner_type: str
    city: str
    address: Optional[str] = None
    description: Optional[str] = None
    license_number: Optional[str] = None
    languages: List[str] = ["french", "arabic"]
    years_experience: Optional[str] = None
    website: Optional[str] = None
