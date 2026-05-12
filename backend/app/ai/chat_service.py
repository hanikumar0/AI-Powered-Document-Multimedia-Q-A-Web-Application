from .gemini_client import gemini_client

class ChatService:
    def __init__(self):
        self.client = gemini_client.get_client()

    async def generate_response(self, message: str, context: str = ""):
        system_prompt = """
        You are an AI assistant for documents and multimedia intelligence.
        If the context below contains information, answer the user's question using that context.
        If the context is empty or irrelevant, behave as a helpful general AI assistant.
        Always be professional, concise, and helpful.
        """
        
        if context:
            full_prompt = f"{system_prompt}\n\nContext:\n{context}\n\nQuestion: {message}\n\nAnswer:"
        else:
            full_prompt = f"{system_prompt}\n\nQuestion: {message}\n\nAnswer:"
        
        response = self.client.models.generate_content(
            model="models/gemini-2.0-flash",
            contents=full_prompt
        )
        return response.text

chat_service = ChatService()
