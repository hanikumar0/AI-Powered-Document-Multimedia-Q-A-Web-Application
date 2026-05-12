from .gemini_client import gemini_client

class ChatService:
    def __init__(self):
        self.client = gemini_client.get_client()

    async def generate_response(self, message: str, context: str):
        prompt = f"""
        You are an AI assistant helping a user understand their documents and multimedia files.
        Use the following context to answer the user's question accurately. 
        If the context includes timestamps, mention them in your answer.
        
        Context:
        {context}
        
        Question: {message}
        
        Answer:
        """
        
        response = self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text

chat_service = ChatService()
