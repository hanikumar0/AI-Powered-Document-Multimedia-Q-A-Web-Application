import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch, AsyncMock
import uuid

@pytest.fixture
def mock_chat_deps():
    with patch("app.api.chat.vector_store.search") as mock_search, \
         patch("app.api.chat.chat_service.generate_response") as mock_gen:
        
        mock_search.return_value = [{"metadata": {"filename": "test.pdf", "text": "Some context"}, "score": 0.1}]
        mock_gen.return_value = "This is the AI answer."
        yield {"search": mock_search, "gen": mock_gen}

@pytest.mark.asyncio
async def test_send_message_success(client, mock_db, mock_chat_deps):
    # Create a session first
    session_id = str(uuid.uuid4())
    await mock_db.chat_sessions.insert_one({
        "_id": session_id,
        "title": "Test Session",
        "file_ids": ["file1"]
    })
    
    # Use client.post directly, Starlette TestClient handles the loop internally for the request
    # but we need to ensure the setup above was awaited.
    response = client.post(
        "/api/chat/message",
        json={"message": "What is in the file?", "session_id": session_id}
    )
    
    # If it returns 404, we need to verify why.
    if response.status_code == 404:
        print(f"DEBUG: Response body: {response.json()}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["answer"] == "This is the AI answer."
    assert "sources" in data

@pytest.mark.asyncio
async def test_get_sessions(client, mock_db):
    await mock_db.chat_sessions.insert_one({
        "_id": "s1",
        "title": "Session 1",
        "updated_at": "2023-01-01T00:00:00"
    })
    
    response = client.get("/api/chat/sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "s1"
@pytest.mark.asyncio
async def test_create_session(client, mock_db):
    response = client.post("/api/chat/sessions", json={"title": "New Session"})
    assert response.status_code == 200
    assert response.json()["title"] == "New Session"
    assert "id" in response.json()

@pytest.mark.asyncio
async def test_get_messages(client, mock_db):
    await mock_db.chat_messages.insert_one({
        "session_id": "s1",
        "role": "user",
        "content": "Hello",
        "timestamp": "2023-01-01T00:00:00"
    })
    response = client.get("/api/chat/sessions/s1/messages")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["content"] == "Hello"

@pytest.mark.asyncio
async def test_attach_files(client, mock_db):
    await mock_db.chat_sessions.insert_one({"_id": "s1", "title": "S1", "file_ids": []})
    response = client.post("/api/chat/sessions/s1/files", json={"file_ids": ["f1", "f2"]})
    assert response.status_code == 200
    session = await mock_db.chat_sessions.find_one({"_id": "s1"})
    assert "f1" in session["file_ids"]

@pytest.mark.asyncio
async def test_send_message_meta_query(client, mock_db, mock_chat_deps):
    with patch("app.api.chat.vector_store.get_all_content_for_files") as mock_meta:
        mock_meta.return_value = [{"metadata": {"text": "All content"}, "score": 0.0}]
        
        session_id = "s2"
        await mock_db.chat_sessions.insert_one({"_id": session_id, "title": "S2", "file_ids": ["f1"]})
        
        response = client.post(
            "/api/chat/message",
            json={"message": "summarize this folder", "session_id": session_id}
        )
        assert response.status_code == 200
        mock_meta.assert_called_once()

@pytest.mark.asyncio
async def test_send_message_rate_limit(client, mock_db, mock_chat_deps):
    mock_chat_deps["gen"].side_effect = Exception("429 RESOURCE_EXHAUSTED")
    
    session_id = "s3"
    await mock_db.chat_sessions.insert_one({"_id": session_id, "title": "S3"})
    
    response = client.post(
        "/api/chat/message",
        json={"message": "Hello", "session_id": session_id}
    )
    assert response.status_code == 429
    assert "rate limit" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_send_message_generic_error(client, mock_db, mock_chat_deps):
    mock_chat_deps["gen"].side_effect = Exception("Fatal blow")
    
    session_id = "s4"
    await mock_db.chat_sessions.insert_one({"_id": session_id, "title": "S4"})
    
    response = client.post(
        "/api/chat/message",
        json={"message": "Hello", "session_id": session_id}
    )
    assert response.status_code == 500
    assert "AI Error" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_session(client, mock_db):
    await mock_db.chat_sessions.insert_one({"_id": "del_me", "title": "Delete"})
    await mock_db.chat_messages.insert_one({"session_id": "del_me", "content": "Msg"})
    
    response = client.delete("/api/chat/sessions/del_me")
    assert response.status_code == 200
    assert (await mock_db.chat_sessions.count_documents({"_id": "del_me"})) == 0
    assert (await mock_db.chat_messages.count_documents({"session_id": "del_me"})) == 0
