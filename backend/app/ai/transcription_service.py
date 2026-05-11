import google.generativeai as genai
import time
import os

class TranscriptionService:
    def __init__(self):
        self.model = genai.GenerativeModel("gemini-3-flash-preview")

    async def transcribe_media(self, file_path: str):
        """
        Transcribes audio/video files using Gemini 3 Flash multimodal capabilities.
        """
        # 1. Upload to Gemini File API
        print(f"Uploading {file_path} to Gemini File API...")
        uploaded_file = genai.upload_file(path=file_path)
        
        # 2. Wait for processing if needed
        while uploaded_file.state.name == "PROCESSING":
            print("Waiting for file processing...")
            time.sleep(2)
            uploaded_file = genai.get_file(uploaded_file.name)

        if uploaded_file.state.name == "FAILED":
            raise ValueError("Gemini file processing failed")

        # 3. Generate transcript
        prompt = "Transcribe this file exactly. Provide the output in a clean text format with segments and timestamps if possible."
        response = self.model.generate_content([uploaded_file, prompt])
        
        # 4. Cleanup (optional, but good practice)
        genai.delete_file(uploaded_file.name)
        
        return response.text

transcription_service = TranscriptionService()
