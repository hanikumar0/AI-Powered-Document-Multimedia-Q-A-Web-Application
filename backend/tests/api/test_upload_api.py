import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch, AsyncMock
import io
import os

@pytest.fixture
def mock_upload_deps():
    with patch("app.api.upload.extract_text_from_pdf") as mock_pdf, \
         patch("app.api.upload.transcription_service.transcribe_media") as mock_trans, \
         patch("app.api.upload.gemini_client.extract_text_with_gemini") as mock_gemini, \
         patch("app.api.upload.vector_store.add_texts") as mock_vs:
        
        mock_pdf.return_value = [{"page": 1, "text": "PDF content"}]
        mock_trans.return_value = "Audio transcript"
        mock_gemini.return_value = "Gemini OCR content"
        yield {"pdf": mock_pdf, "trans": mock_trans, "gemini": mock_gemini, "vs": mock_vs}

@pytest.mark.asyncio
async def test_get_files_empty(client, mock_db):
    response = client.get("/api/upload/files")
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.asyncio
async def test_upload_pdf_success(client, mock_db, mock_upload_deps):
    file_content = b"fake pdf content"
    file = io.BytesIO(file_content)
    
    response = client.post(
        "/api/upload/",
        files={"file": ("test.pdf", file, "application/pdf")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.pdf"
    file_id = data["file_id"]
    
    # Check DB
    file_in_db = await mock_db.files.find_one({"file_id": file_id})
    assert file_in_db is not None
    assert file_in_db["status"] in ["uploaded", "processed"]

@pytest.mark.asyncio
async def test_get_file_status_not_found(client, mock_db):
    response = client.get("/api/upload/nonexistent")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_process_file_pdf(mock_db, mock_upload_deps):
    from app.api.upload import process_file
    
    # Mock extract_text_from_pdf to return pages
    mock_upload_deps["pdf"].return_value = [{"page": 1, "text": "Page 1 content"}]
    
    await process_file("f1", "path.pdf", "test.pdf", "application/pdf")
    
    # Verify vector store was called
    mock_upload_deps["vs"].assert_called_once()
    # Verify status updated to processed
    file_in_db = await mock_db.files.find_one({"file_id": "f1"})
    # Since we didn't insert it in this test, we should insert it first or mock the update
    # Better: insert it first
    await mock_db.files.insert_one({"file_id": "f1", "status": "uploaded"})
    await process_file("f1", "path.pdf", "test.pdf", "application/pdf")
    file_in_db = await mock_db.files.find_one({"file_id": "f1"})
    assert file_in_db["status"] == "processed"

@pytest.mark.asyncio
async def test_process_file_audio(mock_db, mock_upload_deps):
    from app.api.upload import process_file
    await mock_db.files.insert_one({"file_id": "a1", "status": "uploaded"})
    
    await process_file("a1", "path.mp3", "test.mp3", "audio/mpeg")
    
    mock_upload_deps["trans"].assert_called_once()
    file_in_db = await mock_db.files.find_one({"file_id": "a1"})
    assert file_in_db["status"] == "processed"

@pytest.mark.asyncio
async def test_process_file_gemini_fallback(mock_db, mock_upload_deps):
    from app.api.upload import process_file
    await mock_db.files.insert_one({"file_id": "g1", "status": "uploaded"})
    
    # Mock PDF extraction to fail/be empty
    mock_upload_deps["pdf"].return_value = []
    
    await process_file("g1", "scanned.pdf", "scanned.pdf", "application/pdf")
    
    mock_upload_deps["gemini"].assert_called_once()
    file_in_db = await mock_db.files.find_one({"file_id": "g1"})
    assert file_in_db["status"] == "processed"

@pytest.mark.asyncio
async def test_process_file_failure(mock_db, mock_upload_deps):
    from app.api.upload import process_file
    await mock_db.files.insert_one({"file_id": "e1", "status": "uploaded"})
    
    # Mock an error
    mock_upload_deps["pdf"].side_effect = Exception("Crash")
    
    await process_file("e1", "bad.pdf", "bad.pdf", "application/pdf")
    
    file_in_db = await mock_db.files.find_one({"file_id": "e1"})
    assert file_in_db["status"] == "failed"
