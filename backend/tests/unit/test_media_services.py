import pytest
from unittest.mock import MagicMock, patch
from app.ai.summary_service import SummaryService
from app.ai.transcription_service import TranscriptionService

@pytest.fixture
def mock_gemini_client():
    with patch("app.ai.summary_service.gemini_client") as mock:
        client = MagicMock()
        mock.get_client.return_value = client
        yield client

@pytest.mark.asyncio
async def test_summarize_text_success(mock_gemini_client):
    mock_response = MagicMock()
    mock_response.text = "Summary text"
    mock_gemini_client.models.generate_content.return_value = mock_response
    
    service = SummaryService()
    res = await service.summarize_text("Long content")
    assert res == "Summary text"

@pytest.mark.asyncio
async def test_transcribe_media_success(mock_gemini_client):
    mock_file = MagicMock()
    mock_file.name = "files/test"
    mock_file.state = "ACTIVE"
    mock_gemini_client.files.upload.return_value = mock_file
    
    mock_response = MagicMock()
    mock_response.text = "Transcript"
    mock_gemini_client.models.generate_content.return_value = mock_response
    
    with patch("app.ai.transcription_service.gemini_client.get_client", return_value=mock_gemini_client):
        service = TranscriptionService()
        res = await service.transcribe_media("test.mp3")
        assert res == "Transcript"
        mock_gemini_client.files.delete.assert_called_with(name="files/test")

@pytest.mark.asyncio
async def test_transcribe_media_processing_loop(mock_gemini_client):
    # First call returns PROCESSING, second returns ACTIVE
    mock_file_p = MagicMock()
    mock_file_p.state = "PROCESSING"
    mock_file_p.name = "f1"
    
    mock_file_a = MagicMock()
    mock_file_a.state = "ACTIVE"
    mock_file_a.name = "f1"
    
    mock_gemini_client.files.upload.return_value = mock_file_p
    mock_gemini_client.files.get.return_value = mock_file_a
    
    mock_response = MagicMock()
    mock_response.text = "Done"
    mock_gemini_client.models.generate_content.return_value = mock_response
    
    with patch("app.ai.transcription_service.gemini_client.get_client", return_value=mock_gemini_client):
        with patch("app.ai.transcription_service.time.sleep") as mock_sleep:
            service = TranscriptionService()
            res = await service.transcribe_media("test.mp3")
            assert res == "Done"
            assert mock_sleep.called

@pytest.mark.asyncio
async def test_transcribe_media_failure(mock_gemini_client):
    mock_file = MagicMock()
    mock_file.state = "FAILED"
    mock_gemini_client.files.upload.return_value = mock_file
    
    with patch("app.ai.transcription_service.gemini_client.get_client", return_value=mock_gemini_client):
        service = TranscriptionService()
        with pytest.raises(ValueError) as excinfo:
            await service.transcribe_media("test.mp3")
        assert "failed" in str(excinfo.value)
