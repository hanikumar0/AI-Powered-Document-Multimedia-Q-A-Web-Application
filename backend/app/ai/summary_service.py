from .gemini_client import gemini_client

class SummaryService:
    def __init__(self):
        self.model = gemini_client.get_model("gemini-3-flash-preview")

    async def summarize_text(self, text: str):
        prompt = f"Provide a concise and professional summary of the following content:\n\n{text}"
        response = self.model.generate_content(prompt)
        return response.text

summary_service = SummaryService()
