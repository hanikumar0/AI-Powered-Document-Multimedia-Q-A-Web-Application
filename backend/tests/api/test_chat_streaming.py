import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch, AsyncMock
import json

@pytest.mark.asyncio
async def test_send_message_stream_success(client, mock_db):
    # Setup session
    session_id = "s_stream"
    await mock_db.chat_sessions.insert_one({"_id": session_id, "title": "Stream Test", "file_ids": []})
    
    # Mock the chat service stream
    async def mock_stream(*args, **kwargs):
        yield "Hello "
        yield "world!"
        
    with patch("app.api.chat.chat_service.generate_response_stream", side_effect=mock_stream):
        # We use client.post with stream=True or similar? 
        # Actually, TestClient.post with StreamingResponse returns the full body in .text or yields in .iter_lines()
        response = client.post(
            "/api/chat/message/stream",
            json={"message": "hi", "session_id": session_id}
        )
        
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        
        lines = [line for line in response.iter_lines() if line]
        assert len(lines) >= 3 # 2 chunks + 1 done
        
        # Check first chunk
        data1 = json.loads(lines[0].replace("data: ", ""))
        assert data1["type"] == "chunk"
        assert data1["content"] == "Hello "
        
        # Check done event
        done_event = [l for l in lines if '"type": "done"' in l][0]
        data_done = json.loads(done_event.replace("data: ", ""))
        assert data_done["type"] == "done"
        assert "id" in data_done

@pytest.mark.asyncio
async def test_send_message_stream_error(client, mock_db):
    session_id = "s_error"
    await mock_db.chat_sessions.insert_one({"_id": session_id, "title": "Error Test"})
    
    async def mock_error_stream(*args, **kwargs):
        yield "Starting..."
        raise Exception("Stream crash")
        
    with patch("app.api.chat.chat_service.generate_response_stream", side_effect=mock_error_stream):
        response = client.post(
            "/api/chat/message/stream",
            json={"message": "hi", "session_id": session_id}
        )
        
        assert response.status_code == 200
        lines = [line for line in response.iter_lines() if line]
        assert any('"type": "error"' in l for l in lines)
