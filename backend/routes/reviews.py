from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid
import logging

from database import db
from auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


class ReviewCreate(BaseModel):
    target_type: str  # "landmark", "destination", "partner"
    target_id: str
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    content: str
    language: str = "en"


class ReviewFlag(BaseModel):
    reason: str


@router.post("")
async def create_review(data: ReviewCreate, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Check if user already reviewed this target
    existing = await db.reviews.find_one({
        "user_id": user["user_id"],
        "target_type": data.target_type,
        "target_id": data.target_id,
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this item")

    full_user = await db.users.find_one({"id": user["user_id"]}, {"_id": 0, "password": 0})

    review_id = str(uuid.uuid4())
    review_doc = {
        "id": review_id,
        "user_id": user["user_id"],
        "user_name": full_user.get("name", "Traveler") if full_user else "Traveler",
        "target_type": data.target_type,
        "target_id": data.target_id,
        "rating": data.rating,
        "title": data.title,
        "content": data.content,
        "language": data.language,
        "status": "published",
        "helpful_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(review_doc)

    # Update average rating on target (for partners)
    if data.target_type == "partner":
        pipeline = [
            {"$match": {"target_type": "partner", "target_id": data.target_id, "status": "published"}},
            {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
        ]
        stats = await db.reviews.aggregate(pipeline).to_list(1)
        if stats:
            await db.partners.update_one(
                {"id": data.target_id},
                {"$set": {"rating": round(stats[0]["avg"], 1), "reviews_count": stats[0]["count"]}}
            )

    return {
        "id": review_id,
        "message": "Review published",
        "review": {k: v for k, v in review_doc.items() if k != "_id"}
    }


@router.get("")
async def get_reviews(
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    rating: Optional[int] = None,
    sort_by: str = "newest",
    limit: int = 20,
):
    query = {"status": "published"}
    if target_type:
        query["target_type"] = target_type
    if target_id:
        query["target_id"] = target_id
    if rating:
        query["rating"] = rating

    sort_field = "created_at"
    sort_dir = -1
    if sort_by == "highest":
        sort_field = "rating"
        sort_dir = -1
    elif sort_by == "lowest":
        sort_field = "rating"
        sort_dir = 1
    elif sort_by == "helpful":
        sort_field = "helpful_count"
        sort_dir = -1

    reviews = await db.reviews.find(query, {"_id": 0}).sort(sort_field, sort_dir).to_list(limit)

    # Compute aggregate stats
    if target_type and target_id:
        pipeline = [
            {"$match": {"target_type": target_type, "target_id": target_id, "status": "published"}},
            {"$group": {
                "_id": None,
                "avg_rating": {"$avg": "$rating"},
                "total": {"$sum": 1},
                "five": {"$sum": {"$cond": [{"$eq": ["$rating", 5]}, 1, 0]}},
                "four": {"$sum": {"$cond": [{"$eq": ["$rating", 4]}, 1, 0]}},
                "three": {"$sum": {"$cond": [{"$eq": ["$rating", 3]}, 1, 0]}},
                "two": {"$sum": {"$cond": [{"$eq": ["$rating", 2]}, 1, 0]}},
                "one": {"$sum": {"$cond": [{"$eq": ["$rating", 1]}, 1, 0]}},
            }}
        ]
        agg = await db.reviews.aggregate(pipeline).to_list(1)
        stats = agg[0] if agg else {"avg_rating": 0, "total": 0, "five": 0, "four": 0, "three": 0, "two": 0, "one": 0}
        stats.pop("_id", None)
    else:
        stats = None

    return {"reviews": reviews, "stats": stats}


@router.delete("/{review_id}")
async def delete_review(review_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Allow owner or admin
    full_user = await db.users.find_one({"id": user["user_id"]}, {"_id": 0})
    is_admin = full_user and full_user.get("role") == "admin"
    if review["user_id"] != user["user_id"] and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")

    await db.reviews.delete_one({"id": review_id})
    return {"message": "Review deleted"}


@router.post("/{review_id}/flag")
async def flag_review(review_id: str, data: ReviewFlag, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    flag_id = str(uuid.uuid4())
    await db.content_flags.insert_one({
        "id": flag_id,
        "type": "review",
        "target_id": review_id,
        "content": f"Review flagged: {data.reason}",
        "reporter": user["user_id"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"message": "Review flagged for moderation", "flag_id": flag_id}


@router.post("/{review_id}/helpful")
async def mark_helpful(review_id: str, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    result = await db.reviews.update_one(
        {"id": review_id},
        {"$inc": {"helpful_count": 1}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")

    return {"message": "Marked as helpful"}
