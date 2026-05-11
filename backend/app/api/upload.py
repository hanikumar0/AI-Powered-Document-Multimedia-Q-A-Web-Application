from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
import shutil
import os
from uuid import uuid4
from ..db.mongodb import get_database
from ..services.pdf_processor import extract_text_from_pdf
from ..ai.transcription_service import transcription_service
from ..rag.text_chunker import chunk_text
from ..rag.vector_store import vector_store
from ..ai.gemini_client import gemini_client

router = APIRouter(prefix="/upload", tags=["Upload"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/")
async def get_files():
    db = get_database()
    files = await db.files.find().to_list(100)
    for file in files:
        file["_id"] = str(file["_id"])
    return files

@router.post("/")
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    file_id = str(uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        db = get_database()
        file_data = {
            "file_id": file_id,
            "filename": file.filename,
            "type": file.content_type,
            "path": file_path,
            "status": "uploaded"
        }
        await db.files.insert_one(file_data)
        
        background_tasks.add_task(process_file, file_id, file_path, file.filename, file.content_type)
        
        return {"file_id": file_id, "filename": file.filename, "message": "File uploaded and Gemini processing started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_file(file_id: str, file_path: str, filename: str, content_type: str):
    db = get_database()
    text = ""
    
    try:
        if "pdf" in content_type:
            text = extract_text_from_pdf(file_path)
        elif "audio" in content_type or "video" in content_type:
            text = await transcription_service.transcribe_media(file_path)
        
        # Fallback to Gemini if no text was extracted (e.g., scanned PDF/Image)
        if not text and ("pdf" in content_type or "image" in content_type):
            print(f"Standard extraction failed for {filename}, falling back to Gemini AI...")
            text = await gemini_client.extract_text_with_gemini(file_path, content_type)
        
        if text:
            chunks = chunk_text(text)
            metadatas = [{"file_id": file_id, "filename": filename, "text": chunk} for chunk in chunks]
            vector_store.add_texts(chunks, metadatas)
            
            await db.files.update_one({"file_id": file_id}, {"$set": {"status": "processed"}})
        else:
            await db.files.update_one({"file_id": file_id}, {"$set": {"status": "failed"}})
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Processing error for {filename}: {e}")
        await db.files.update_one({"file_id": file_id}, {"$set": {"status": "failed"}})
