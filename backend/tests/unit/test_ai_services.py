import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.ai.embedding_service import EmbeddingService
from app.ai.gemini_client import GeminiClient

@pytest.fixture
def mock_genai_client():
    with patch("app.ai.gemini_client.genai.Client") as mock:
        client = MagicMock()
        mock.return_value = client
        yield client

def test_gemini_client_init(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "fake_key")
    client = GeminiClient()
    assert client.get_client() is not None

def test_gemini_client_init_error(monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    # We need to bypass the singleton or re-instantiate
    with pytest.raises(ValueError):
        GeminiClient()

@pytest.mark.asyncio
async def test_extract_text_with_gemini_success(mock_genai_client):
    mock_file = MagicMock()
    mock_genai_client.files.upload.return_value = mock_file
    
    mock_response = MagicMock()
    mock_response.text = "Extracted text"
    mock_genai_client.models.generate_content.return_value = mock_response
    
    with patch("app.ai.gemini_client.os.getenv", return_value="key"):
        client = GeminiClient()
        text = await client.extract_text_with_gemini("path.pdf", "application/pdf")
        assert text == "Extracted text"

@pytest.mark.asyncio
async def test_embedding_service_success(mock_genai_client):
    mock_emb = MagicMock()
    mock_emb.values = [0.1, 0.2]
    mock_response = MagicMock()
    mock_response.embeddings = [mock_emb]
    mock_genai_client.models.embed_content.return_value = mock_response
    
    with patch("app.ai.embedding_service.gemini_client.get_client", return_value=mock_genai_client):
        with patch("app.ai.embedding_service.cache_service.get", return_value=None):
            with patch("app.ai.embedding_service.cache_service.set", new_callable=AsyncMock):
                service = EmbeddingService()
                res = await service.get_embeddings(["test"])
                assert len(res) == 1
                assert res[0] == [0.1, 0.2]

@pytest.mark.asyncio
async def test_embedding_service_error(mock_genai_client):
    mock_genai_client.models.embed_content.side_effect = Exception("Fail")
    
    with patch("app.ai.embedding_service.gemini_client.get_client", return_value=mock_genai_client):
        with patch("app.ai.embedding_service.cache_service.get", return_value=None):
            service = EmbeddingService()
            res = await service.get_embeddings(["test"])
            assert res == []

@pytest.mark.asyncio
async def test_query_embedding_success(mock_genai_client):
    mock_emb = MagicMock()
    mock_emb.values = [0.5, 0.6]
    mock_response = MagicMock()
    mock_response.embeddings = [mock_emb]
    mock_genai_client.models.embed_content.return_value = mock_response
    
    with patch("app.ai.embedding_service.gemini_client.get_client", return_value=mock_genai_client):
        with patch("app.ai.embedding_service.cache_service.get", return_value=None):
            with patch("app.ai.embedding_service.cache_service.set", new_callable=AsyncMock):
                service = EmbeddingService()
                res = await service.get_query_embedding("query")
                assert res == [0.5, 0.6]
