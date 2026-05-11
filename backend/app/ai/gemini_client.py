import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        genai.configure(api_key=self.api_key)
        
    def get_model(self, model_name="models/gemini-3-flash-preview"):
        return genai.GenerativeModel(model_name)

    async def extract_text_with_gemini(self, file_path: str, mime_type: str):
        try:
            model = self.get_model()
            file_data = genai.upload_file(file_path, mime_type=mime_type)
            response = model.generate_content([
                file_data,
                "Extract all text from this document accurately. If it's an ID card, extract the details."
            ])
            return response.text
        except Exception as e:
            print(f"Gemini extraction error: {e}")
            return None

gemini_client = GeminiClient()
