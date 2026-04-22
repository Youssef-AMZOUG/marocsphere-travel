from fastapi import APIRouter
from typing import Optional
from datetime import datetime, timezone
import uuid
import logging

from emergentintegrations.llm.chat import LlmChat, UserMessage
from database import db
from models import ChatMessageRequest
from config import EMERGENT_LLM_KEY

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

SYSTEM_MESSAGE = """You are MarocSphere AI, an expert Moroccan travel assistant. You have deep knowledge of:
- Historical sites, cultural experiences, festivals (Ramadan, Moussem)
- Local customs, dress codes, tipping, photography rules
- Safety: areas to avoid, common scams, emergency numbers (Police: 19, Ambulance: 15)
- Transport: CTM buses, ONCF trains, petit/grand taxis
- Food: tagines, couscous, pastilla, mint tea traditions
- Shopping: bargaining in souks, authentic crafts vs tourist traps
Keep responses concise (2-3 paragraphs max). Be warm and helpful. Include practical tips."""


@router.post("/send")
async def chat_send(data: ChatMessageRequest):
    session_id = data.session_id or str(uuid.uuid4())

    history = await db.messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(20)

    # Build context from history for the LLM
    context_parts = []
    for msg in history:
        role = "User" if msg["role"] == "user" else "Assistant"
        context_parts.append(f"{role}: {msg['content']}")

    full_prompt = ""
    if context_parts:
        full_prompt = "\n".join(context_parts) + "\n\n"
    full_prompt += f"User: {data.content}\n\nAssistant:"

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=SYSTEM_MESSAGE,
        ).with_model("anthropic", "claude-sonnet-4-6")

        user_message = UserMessage(text=full_prompt)
        ai_reply = await chat.send_message(user_message)
    except Exception as e:
        logger.warning(f"AI chat failed, using fallback: {e}")
        ai_reply = "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. In the meantime, feel free to explore our interactive map for Morocco travel information!"

    now = datetime.now(timezone.utc).isoformat()
    await db.messages.insert_one({"session_id": session_id, "role": "user", "content": data.content, "created_at": now})
    await db.messages.insert_one({"session_id": session_id, "role": "ai", "content": ai_reply, "created_at": now})

    return {"reply": ai_reply, "session_id": session_id}


@router.get("/messages/{session_id}")
async def get_chat_messages(session_id: str):
    messages = await db.messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return {"messages": messages}
