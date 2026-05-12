import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from app.ai.chat_service import ChatService

@pytest.fixture
def mock_gemini_client():
    with patch("app.ai.chat_service.gemini_client") as mock:
        client = MagicMock()
        mock.get_client.return_value = client
        yield client

@pytest.mark.asyncio
async def test_generate_response_success(mock_gemini_client):
    # Setup mock response
    mock_response = MagicMock()
    mock_response.text = "Mocked AI answer"
    mock_gemini_client.models.generate_content.return_value = mock_response
    
    service = ChatService()
    answer = await service.generate_response("Hello", context="Some context")
    
    assert answer == "Mocked AI answer"
    mock_gemini_client.models.generate_content.assert_called_once()

@pytest.mark.asyncio
async def test_generate_response_with_history(mock_gemini_client):
    mock_response = MagicMock()
    mock_response.text = "Answer with history"
    mock_gemini_client.models.generate_content.return_value = mock_response
    
    history = [{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello"}]
    service = ChatService()
    answer = await service.generate_response("How are you?", history=history)
    
    assert answer == "Answer with history"
    # Verify history was included in contents
    args, kwargs = mock_gemini_client.models.generate_content.call_args
    contents = kwargs["contents"]
    assert len(contents) == 3 # 2 history + 1 current
    assert contents[0]["role"] == "user"
    assert contents[1]["role"] == "model"

@pytest.mark.asyncio
async def test_generate_response_empty_gemini(mock_gemini_client):
    mock_response = MagicMock()
    mock_response.text = ""
    mock_gemini_client.models.generate_content.return_value = mock_response
    
    service = ChatService()
    answer = await service.generate_response("Question")
    
    assert "couldn't generate a response" in answer

@pytest.mark.asyncio
async def test_generate_response_error(mock_gemini_client):
    mock_gemini_client.models.generate_content.side_effect = Exception("API Down")
    
    service = ChatService()
    with pytest.raises(Exception) as excinfo:
        await service.generate_response("Question")
    
    assert "API Down" in str(excinfo.value)
