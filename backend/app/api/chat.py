from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import StreamingResponse
from fastapi_limiter.depends import RateLimiter
import json
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
from ..rag.vector_store import vector_store
from ..db.mongodb import get_database
from ..ai.chat_service import chat_service

from ..services.cache_service import cache_service

router = APIRouter(tags=["Chat"])

async def get_limiter(request: Request, response: Response):
    """Dependency that only executes RateLimiter if Redis is connected."""
    if cache_service.redis:
        limiter = RateLimiter(times=10, seconds=60)
        return await limiter(request, response)
    return None

def rate_limit():
    """Returns a list of dependencies for rate limiting, or empty if no Redis."""
    if cache_service.redis:
        return [Depends(RateLimiter(times=10, seconds=60))]
    return []


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
    current_time: Optional[float] = None
    media_id: Optional[str] = None

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
    for m in messages:
        m["id"] = str(m.pop("_id"))
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
async def send_message(request: ChatRequest, _ = Depends(get_limiter)):
    db = get_database()
    session = await db.chat_sessions.find_one({"_id": request.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    file_ids = session.get("file_ids", [])
    
    try:
        # 1. Search vector store (filtered by conversation files)
        # For meta-queries like "what is inside", "summary", "details", fetch all content
        meta_keywords = ["folder", "file", "inside", "detail", "summary", "all", "this", "these"]
        if file_ids and any(kw in request.message.lower() for kw in meta_keywords):
            print(f"Meta-query detected: {request.message}. Fetching all file content.")
            results = vector_store.get_all_content_for_files(file_ids)
        else:
            results = await vector_store.search(request.message, k=5, file_ids=file_ids)
        
        # 2. Get attached file names for prompt context
        attached_file_names = []
        if file_ids:
            try:
                files_data = await db.files.find({"file_id": {"$in": file_ids}}).to_list(length=100)
                attached_file_names = [f["filename"] for f in files_data]
            except Exception as fe:
                print(f"Warning: Failed to fetch file names: {fe}")

        # 3. Fetch conversation history for multi-turn context
        formatted_history = []
        try:
            history = await db.chat_messages.find({"session_id": request.session_id}).sort("timestamp", 1).to_list(length=20)
            formatted_history = [{"role": m["role"], "content": m["content"]} for m in history]
        except Exception as he:
            print(f"Warning: Failed to fetch history: {he}")

        # 4. Construct context
        context = ""
        sources = []
        mode = "general"
        
        if results:
            mode = "rag"
            print(f"--- Raw Context for Query: {request.message} ---")
            for res in results:
                meta = res["metadata"]
                page_info = f" (Page {meta.get('page')})" if meta.get("page") else ""
                source_text = f"\nContent: {meta.get('text')}\nSource: {meta.get('filename')}{page_info}\n"
                context += source_text
                print(source_text)
                sources.append(meta)
            print("--- End of Context ---")

        # 5. Call Chat Service (Gemini)
        print(f"Generating response for session {request.session_id} with {len(attached_file_names)} files and {len(formatted_history)} history messages.")
        answer = await chat_service.generate_response(
            request.message, 
            context, 
            attached_files=attached_file_names, 
            history=formatted_history
        )
        
        # Deduplicate sources for cleaner UI representation (one chip per file)
        seen_filenames = set()
        deduplicated_sources = []
        for s in sources:
            fname = s.get("filename")
            if fname not in seen_filenames:
                seen_filenames.add(fname)
                deduplicated_sources.append(s)

        # 6. Save messages
        user_msg = {
            "session_id": request.session_id,
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now()
        }
        ai_msg = {
            "session_id": request.session_id,
            "role": "assistant",
            "content": answer, # Kept for frontend Message interface
            "answer": answer,  # Added for reliability Step 9
            "sources": deduplicated_sources,
            "mode": mode,
            "timestamp": datetime.now()
        }
        
        await db.chat_messages.insert_many([user_msg, ai_msg])
        await db.chat_sessions.update_one(
            {"_id": request.session_id},
            {"$set": {"updated_at": datetime.now()}}
        )
        
        # Convert _id to id for response
        ai_msg["id"] = str(ai_msg.pop("_id"))
        return ai_msg
    except Exception as e:
        import traceback
        traceback.print_exc()
        error_msg = str(e)
        print(f"Chat error details: {error_msg}")
        
        # Catch various forms of rate limit/quota errors
        is_rate_limit = any(term in error_msg.upper() for term in ["429", "RESOURCE_EXHAUSTED", "QUOTA", "RATE_LIMIT"])
        
        if is_rate_limit:
            raise HTTPException(
                status_code=429, 
                detail="AI service rate limit reached. Please wait a few seconds and try again."
            )
        
        raise HTTPException(status_code=500, detail=f"AI Error: {error_msg}")

@router.post("/message/stream")
async def send_message_stream(request: ChatRequest, _ = Depends(get_limiter)):
    db = get_database()
    session = await db.chat_sessions.find_one({"_id": request.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    file_ids = session.get("file_ids", [])
    
    async def stream_generator():
        full_answer = ""
        sources = []
        mode = "general"
        
        try:
            # 1. Search vector store
            results = []
            
            # Timeline-Aware Retrieval: If watching a specific time, get nearby chunks first
            if request.current_time is not None and request.media_id:
                results = vector_store.get_context_around_time(request.media_id, request.current_time)
                print(f"Retrieved {len(results)} chunks around timestamp {request.current_time}")

            # Semantic Search: Supplement with relevant chunks from all attached files
            meta_keywords = ["folder", "file", "inside", "detail", "summary", "all", "this", "these"]
            semantic_results = []
            if file_ids and any(kw in request.message.lower() for kw in meta_keywords):
                semantic_results = vector_store.get_all_content_for_files(file_ids)
            else:
                semantic_results = await vector_store.search(request.message, k=5, file_ids=file_ids)
            
            # Merge and avoid duplicates
            seen_texts = {r["metadata"]["text"] for r in results}
            for sr in semantic_results:
                if sr["metadata"]["text"] not in seen_texts:
                    results.append(sr)
                    seen_texts.add(sr["metadata"]["text"])
            
            # 2. Get attached file names
            attached_file_names = []
            if file_ids:
                files_data = await db.files.find({"file_id": {"$in": file_ids}}).to_list(length=100)
                attached_file_names = [f["filename"] for f in files_data]

            # 3. Fetch conversation history
            history = await db.chat_messages.find({"session_id": request.session_id}).sort("timestamp", 1).to_list(length=20)
            formatted_history = [{"role": m["role"], "content": m["content"]} for m in history]

            # 4. Construct context
            context = ""
            if results:
                mode = "rag"
                for res in results:
                    meta = res["metadata"]
                    page_info = f" (Page {meta.get('page')})" if meta.get("page") else ""
                    context += f"\nContent: {meta.get('text')}\nSource: {meta.get('filename')}{page_info}\n"
                    sources.append(meta)

            # 5. Start Stream
            async for chunk in chat_service.generate_streaming_response(
                request.message, 
                request.session_id,
                current_time=request.current_time,
                media_id=request.media_id,
                context=context, 
                attached_files=attached_file_names, 
                history=formatted_history
            ):
                full_answer += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"

            # 6. Deduplicate sources
            seen_filenames = set()
            deduplicated_sources = []
            for s in sources:
                fname = s.get("filename")
                if fname not in seen_filenames:
                    seen_filenames.add(fname)
                    deduplicated_sources.append(s)

            # 7. Save messages
            user_msg = {
                "session_id": request.session_id,
                "role": "user",
                "content": request.message,
                "timestamp": datetime.now()
            }
            ai_msg_id = str(uuid.uuid4())
            ai_msg = {
                "_id": ai_msg_id,
                "session_id": request.session_id,
                "role": "assistant",
                "content": full_answer,
                "answer": full_answer,
                "sources": deduplicated_sources,
                "mode": mode,
                "timestamp": datetime.now()
            }
            await db.chat_messages.insert_many([user_msg, ai_msg])
            await db.chat_sessions.update_one(
                {"_id": request.session_id},
                {"$set": {"updated_at": datetime.now()}}
            )

            # 8. Send final event
            yield f"data: {json.dumps({'type': 'done', 'id': ai_msg_id, 'sources': deduplicated_sources})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    db = get_database()
    await db.chat_sessions.delete_one({"_id": session_id})
    await db.chat_messages.delete_many({"session_id": session_id})
    return {"status": "deleted"}
