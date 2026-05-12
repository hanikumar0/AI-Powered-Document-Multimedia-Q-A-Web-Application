import pytest
from unittest.mock import MagicMock, patch
from app.services.pdf_processor import extract_text_from_pdf

@patch("app.services.pdf_processor.fitz.open")
def test_extract_text_from_pdf_success(mock_open):
    # Setup mock doc and page
    mock_doc = MagicMock()
    mock_page = MagicMock()
    mock_page.get_text.return_value = "Sample text"
    mock_doc.__iter__.return_value = [mock_page]
    mock_open.return_value = mock_doc
    
    result = extract_text_from_pdf("fake.pdf")
    
    assert len(result) == 1
    assert result[0]["text"] == "Sample text"
    assert result[0]["page"] == 1
    mock_doc.close.assert_called_once()

@patch("app.services.pdf_processor.fitz.open")
def test_extract_text_from_pdf_empty(mock_open):
    mock_doc = MagicMock()
    mock_page = MagicMock()
    mock_page.get_text.return_value = "" # Empty page
    mock_doc.__iter__.return_value = [mock_page]
    mock_open.return_value = mock_doc
    
    result = extract_text_from_pdf("empty.pdf")
    assert result == []

@patch("app.services.pdf_processor.fitz.open")
def test_extract_text_from_pdf_error(mock_open):
    mock_open.side_effect = Exception("Open failed")
    
    result = extract_text_from_pdf("bad.pdf")
    assert result is None
