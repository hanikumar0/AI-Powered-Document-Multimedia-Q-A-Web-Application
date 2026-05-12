from .gemini_client import gemini_client

class SummaryService:
    def __init__(self):
        self.client = gemini_client.get_client()

    async def summarize_text(self, text: str):
        prompt = f"Provide a concise and professional summary of the following content:\n\n{text}"
        response = self.client.models.generate_content(
            model="models/gemini-2.0-flash",
            contents=prompt
        )
        return response.text

summary_service = SummaryService()
