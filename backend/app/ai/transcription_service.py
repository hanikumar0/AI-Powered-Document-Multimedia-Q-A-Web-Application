from google import genai
import time
import os
from .gemini_client import gemini_client

class TranscriptionService:
    def __init__(self):
        self.client = gemini_client.get_client()

    async def transcribe_media(self, file_path: str):
        """
        Transcribes audio/video files using Gemini 2.0 Flash multimodal capabilities.
        """
        try:
            # 1. Upload to Gemini File API
            print(f"Uploading {file_path} to Gemini File API...")
            uploaded_file = self.client.files.upload(path=file_path)
            
            # 2. Wait for processing (the new SDK handles some of this, but checking state is safer)
            # In google-genai, we check state via uploaded_file.state
            while uploaded_file.state == "PROCESSING":
                print("Waiting for file processing...")
                time.sleep(2)
                uploaded_file = self.client.files.get(name=uploaded_file.name)

            if uploaded_file.state == "FAILED":
                raise ValueError("Gemini file processing failed")

            # 3. Generate transcript
            prompt = "Transcribe this file exactly. Provide the output in a clean text format with segments and timestamps if possible."
            response = self.client.models.generate_content(
                model="models/gemini-3-flash-preview",
                contents=[uploaded_file, prompt]
            )
            
            # 4. Cleanup
            self.client.files.delete(name=uploaded_file.name)
            
            return response.text
        except Exception as e:
            print(f"Transcription error: {e}")
            raise e

transcription_service = TranscriptionService()
