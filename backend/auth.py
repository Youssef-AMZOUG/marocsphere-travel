from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException
import bcrypt
import jwt
from config import JWT_SECRET


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_token(user_id: str, email: str, name: str) -> str:
    return jwt.encode(
        {"user_id": user_id, "email": email, "name": name, "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7},
        JWT_SECRET, algorithm="HS256"
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(authorization: Optional[str] = None):
    if not authorization:
        return None
    try:
        token = authorization.replace("Bearer ", "")
        return decode_token(token)
    except Exception:
        return None
