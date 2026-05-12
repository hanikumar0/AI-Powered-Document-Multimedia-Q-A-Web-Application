import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        self.client = genai.Client(api_key=self.api_key)
        
    def get_client(self):
        return self.client

    async def extract_text_with_gemini(self, file_path: str, mime_type: str):
        try:
            # Note: client.files.upload is synchronous in the current SDK version
            file_data = self.client.files.upload(path=file_path)
            
            response = self.client.models.generate_content(
                model="models/gemini-3-flash-preview", 
                contents=[
                    file_data,
                    "Extract all text from this document accurately. If it's an ID card, extract the details."
                ]
            )
            return response.text
        except Exception as e:
            print(f"Gemini extraction error: {e}")
            return None

gemini_client = GeminiClient()
