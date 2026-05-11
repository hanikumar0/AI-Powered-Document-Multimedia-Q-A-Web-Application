from .gemini_client import gemini_client

class ChatService:
    def __init__(self):
        self.model = gemini_client.get_model("gemini-3-flash-preview")

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
        
        response = self.model.generate_content(prompt)
        return response.text

chat_service = ChatService()
