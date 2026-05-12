from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..rag.vector_store import vector_store
from ..db.mongodb import get_database
from ..ai.chat_service import chat_service

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str
    file_id: str = None

@router.post("/")
async def chat(request: ChatRequest):
    try:
        # 1. Search vector store (only if there are files)
        results = vector_store.search(request.message, k=5)
        
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
        
        # 4. Save to chat history
        db = get_database()
        await db.chat_history.insert_one({
            "question": request.message,
            "answer": answer,
            "sources": sources,
            "mode": mode,
            "timestamp": "now" # In a real app use datetime.utcnow()
        })
        
        return {
            "answer": answer,
            "sources": sources,
            "mode": mode
        }
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
