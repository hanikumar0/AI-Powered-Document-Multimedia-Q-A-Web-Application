from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
from ..rag.vector_store import vector_store
from ..db.mongodb import get_database
from ..ai.chat_service import chat_service

router = APIRouter(prefix="/chat", tags=["Chat"])

# --- Models ---

class Message(BaseModel):
    role: str
    content: str
    timestamp: datetime = datetime.now()
    sources: Optional[List[dict]] = []

class ChatSession(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    file_ids: List[str] = []

class ChatRequest(BaseModel):
    message: str
    session_id: str

class SessionCreate(BaseModel):
    title: str = "New Conversation"

class FileAttachRequest(BaseModel):
    file_ids: List[str]

# --- Endpoints ---

@router.get("/sessions")
async def get_sessions():
    db = get_database()
    sessions = await db.chat_sessions.find().sort("updated_at", -1).to_list(100)
    # Convert _id to id for frontend
    for s in sessions:
        s["id"] = s.pop("_id")
    return sessions

@router.post("/sessions")
async def create_session(request: SessionCreate):
    db = get_database()
    session_id = str(uuid.uuid4())
    session = {
        "_id": session_id,
        "title": request.title,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "file_ids": []
    }
    await db.chat_sessions.insert_one(session)
    session["id"] = session.pop("_id")
    return session

@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str):
    db = get_database()
    messages = await db.chat_messages.find({"session_id": session_id}).sort("timestamp", 1).to_list(1000)
    return messages

@router.post("/sessions/{session_id}/files")
async def attach_files(session_id: str, request: FileAttachRequest):
    db = get_database()
    await db.chat_sessions.update_one(
        {"_id": session_id},
        {"$addToSet": {"file_ids": {"$each": request.file_ids}}, "$set": {"updated_at": datetime.now()}}
    )
    return {"status": "success"}

@router.post("/message")
async def send_message(request: ChatRequest):
    db = get_database()
    session = await db.chat_sessions.find_one({"_id": request.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    file_ids = session.get("file_ids", [])
    
    try:
        # 1. Search vector store (filtered by conversation files)
        results = vector_store.search(request.message, k=5, file_ids=file_ids)
        
        # 2. Construct context
        context = ""
        sources = []
        mode = "general"
        
        if results:
            mode = "rag"
            for res in results:
                meta = res["metadata"]
                context += f"\nContent: {meta.get('text')}\nSource: {meta.get('filename')} at {meta.get('timestamp', 'N/A')}\n"
                sources.append(meta)

        # 3. Call Chat Service (Gemini)
        answer = await chat_service.generate_response(request.message, context)
        
        # 4. Save messages
        user_msg = {
            "session_id": request.session_id,
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now()
        }
        ai_msg = {
            "session_id": request.session_id,
            "role": "assistant",
            "content": answer,
            "sources": sources,
            "mode": mode,
            "timestamp": datetime.now()
        }
        
        await db.chat_messages.insert_many([user_msg, ai_msg])
        await db.chat_sessions.update_one(
            {"_id": request.session_id},
            {"$set": {"updated_at": datetime.now()}}
        )
        
        return ai_msg
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    db = get_database()
    await db.chat_sessions.delete_one({"_id": session_id})
    await db.chat_messages.delete_many({"session_id": session_id})
    return {"status": "deleted"}
