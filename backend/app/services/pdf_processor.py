import fitz  # PyMuPDF
import os

def extract_text_from_pdf(pdf_path: str):
    """Extracts text from PDF and returns a list of dictionaries with page numbers and text."""
    pages = []
    try:
        doc = fitz.open(pdf_path)
        for i, page in enumerate(doc):
            text = page.get_text().strip()
            if text:
                pages.append({
                    "page": i + 1,
                    "text": text
                })
        doc.close()
        return pages
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None
