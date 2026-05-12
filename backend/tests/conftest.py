import pytest
import os
import sys
import asyncio
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient
import mongomock

# Add app root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# --- Async Wrapper for Mongomock ---
class AsyncMockCursor:
    def __init__(self, cursor):
        self._cursor = cursor

    def sort(self, *args, **kwargs):
        self._cursor.sort(*args, **kwargs)
        return self

    async def to_list(self, length=None):
        return list(self._cursor)[:length]

    def __aiter__(self):
        self._iter = iter(self._cursor)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration

class AsyncMockCollection:
    def __init__(self, collection):
        self._collection = collection

    async def find_one(self, *args, **kwargs):
        return self._collection.find_one(*args, **kwargs)

    async def insert_one(self, *args, **kwargs):
        return self._collection.insert_one(*args, **kwargs)

    async def insert_many(self, *args, **kwargs):
        return self._collection.insert_many(*args, **kwargs)

    async def update_one(self, *args, **kwargs):
        return self._collection.update_one(*args, **kwargs)

    async def delete_one(self, *args, **kwargs):
        return self._collection.delete_one(*args, **kwargs)

    async def delete_many(self, *args, **kwargs):
        return self._collection.delete_many(*args, **kwargs)

    async def count_documents(self, *args, **kwargs):
        return self._collection.count_documents(*args, **kwargs)

    def find(self, *args, **kwargs):
        return AsyncMockCursor(self._collection.find(*args, **kwargs))

class AsyncMockDatabase:
    def __init__(self, db):
        self._db = db

    def __getattr__(self, name):
        return AsyncMockCollection(self._db[name])

    def __getitem__(self, name):
        return AsyncMockCollection(self._db[name])

@pytest.fixture(autouse=True)
def mock_settings(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test_secret")
    monkeypatch.setenv("GOOGLE_API_KEY", "test_key")
    monkeypatch.setenv("MONGO_URL", "mongodb://localhost:27017")
    monkeypatch.setenv("DB_NAME", "test_db")
    monkeypatch.setenv("UPLOAD_DIR", "./test_uploads")

@pytest.fixture
def mock_db():
    client = mongomock.MongoClient()
    db = client["test_db"]
    return AsyncMockDatabase(db)

@pytest.fixture(autouse=True)
def patch_db(mock_db, monkeypatch):
    # Import inside fixture to ensure monkeypatch works before modules use it
    from app.db import mongodb
    from app.api import chat, auth, upload
    
    # Block real connections
    monkeypatch.setattr(mongodb, "connect_to_mongo", AsyncMock())
    monkeypatch.setattr(mongodb, "close_mongo_connection", AsyncMock())
    
    # Force get_database to return our mock in the mongodb module
    monkeypatch.setattr(mongodb, "get_database", lambda: mock_db)
    mongodb.db = mock_db
    
    # CRITICAL: Also patch the modules that have already imported get_database
    from app.api import chat, upload
    from app.services import auth_service
    from app.dependencies import auth_dependency
    
    monkeypatch.setattr(chat, "get_database", lambda: mock_db)
    monkeypatch.setattr(upload, "get_database", lambda: mock_db)
    monkeypatch.setattr(auth_service, "get_database", lambda: mock_db)
    monkeypatch.setattr(auth_dependency, "get_database", lambda: mock_db)
    
    # Patch MotorClient just in case anyone else initializes it
    with patch("motor.motor_asyncio.AsyncIOMotorClient", return_value=MagicMock()):
        yield mock_db

@pytest.fixture
def client(patch_db):
    from app.main import app
    # Use follow_redirects=True if needed
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
