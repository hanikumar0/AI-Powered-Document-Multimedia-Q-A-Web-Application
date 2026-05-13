from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from contextlib import asynccontextmanager
from .api import upload, chat, auth
from .db.mongodb import connect_to_mongo, close_mongo_connection
from .services.cache_service import cache_service
from fastapi_limiter import FastAPILimiter

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await connect_to_mongo()
    await cache_service.connect()
    
    if cache_service.redis:
        await FastAPILimiter.init(cache_service.redis)
        print("FastAPILimiter initialized")
    
    yield
    # Shutdown logic
    await close_mongo_connection()

app = FastAPI(
    title="AI Document & Multimedia Q&A API",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists and mount it for reliable streaming
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(upload.router, prefix="/api/upload")
app.include_router(chat.router, prefix="/api/chat")
app.include_router(auth.router, prefix="/api/auth")

@app.get("/")
async def root():
    return {"message": "Welcome to the AI Document & Multimedia Q&A API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    # Use app.main:app to ensure uvicorn finds the module correctly when run from backend root
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
