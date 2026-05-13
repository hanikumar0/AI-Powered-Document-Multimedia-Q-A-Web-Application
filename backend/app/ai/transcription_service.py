import hashlib
import asyncio
from .gemini_client import gemini_client
from ..services.cache_service import cache_service

class TranscriptionService:
    def __init__(self):
        self.client = gemini_client.get_client()

    async def transcribe_media(self, file_path: str):
        """
        Transcribes audio/video files using Gemini with Redis caching.
        """
        try:
            # 1. Generate file hash for caching
            with open(file_path, "rb") as f:
                file_hash = hashlib.md5(f.read()).hexdigest()
            
            cache_key = f"transcription:{file_hash}"
            cached = await cache_service.get(cache_key)
            if cached:
                print(f"Transcription cache hit for {file_path}")
                return cached

            # 2. Upload to Gemini File API
            print(f"Uploading {file_path} to Gemini File API...")
            uploaded_file = self.client.files.upload(path=file_path)
            
            while uploaded_file.state == "PROCESSING":
                print("Waiting for file processing...")
                await asyncio.sleep(2)
                uploaded_file = self.client.files.get(name=uploaded_file.name)

            if uploaded_file.state == "FAILED":
                raise ValueError("Gemini file processing failed")

            # 3. Generate transcript with structured timestamps
            prompt = """
            Transcribe this media file. Provide the output strictly as a JSON list of segments.
            Each segment MUST have:
            - "start": start time in seconds (float)
            - "end": end time in seconds (float)
            - "text": the transcribed text for this segment
            - "timestamp_label": a string like "[02:15]" representing the start time.
            
            Example: [{"start": 10.5, "end": 15.0, "text": "Hello world", "timestamp_label": "[00:10]"}]
            Return ONLY the JSON.
            """
            response = self.client.models.generate_content(
                model="models/gemini-2.0-flash", # Using 2.0 Flash for better JSON adherence
                contents=[uploaded_file, prompt]
            )
            
            # Extract JSON from potential markdown code blocks
            text = response.text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            transcript_str = text.strip()
            transcript_data = []
            
            # 4. Final Validation: Ensure we don't return empty strings if possible
            if transcript_str:
                try:
                    transcript_data = json.loads(transcript_str)
                except Exception as je:
                    print(f"Failed to parse transcript JSON: {je}")
                    # Fallback or keep empty
            
            # 5. Cache and Cleanup
            if transcript_data:
                await cache_service.set(cache_key, transcript_data, expire=86400 * 30) # 30 days
            
            try:
                self.client.files.delete(name=uploaded_file.name)
            except:
                pass
            
            return transcript_data
        except Exception as e:
            print(f"Transcription error: {e}")
            raise e

transcription_service = TranscriptionService()
