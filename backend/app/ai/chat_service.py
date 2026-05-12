from .gemini_client import gemini_client

class ChatService:
    def __init__(self):
        self.client = gemini_client.get_client()

    async def generate_response(self, message: str, context: str = "", attached_files: list[str] = None, history: list[dict] = None):
        files_str = ", ".join(attached_files) if attached_files else "None"
        
        system_prompt = f"""
        You are a senior AI document intelligence system. Your primary goal is ACCURACY and GROUNDING.
        The user has attached the following files to this conversation: {files_str}.
        
        CRITICAL OPERATING INSTRUCTIONS:
        1. You must ONLY answer using the provided retrieved document context.
        2. Do NOT invent, infer, fabricate, or hallucinate any information (names, ID numbers, dates, values).
        3. Do NOT "fill in missing fields" or assume values based on common patterns.
        4. If the information is not explicitly present in the provided context, you must say:
           "I could not find that information in the uploaded document."
        5. Every fact you state must include a citation in brackets, e.g., [File: name.pdf, Page: 1].
        6. Every fact you state must be grounded in the provided context.
        7. Be professional, concise, and purely factual. You are a document processor, not a creative writer.
        
        If the context is empty but files are attached, acknowledge the files and ask for a specific question about them, but do NOT speculate on their contents.
        """
        
        # Build contents for Gemini 3
        contents = []
        
        # Add history
        if history:
            for msg in history:
                contents.append({
                    "role": "user" if msg["role"] == "user" else "model",
                    "parts": [{"text": msg["content"]}]
                })
        
        # Add current message with context
        current_content = ""
        if context:
            current_content += f"Context from attached files:\n{context}\n\n"
        
        current_content += f"User Question: {message}"
        
        contents.append({
            "role": "user",
            "parts": [{"text": current_content}]
        })
        
        try:
            # Using the genai.Client (new SDK) syntax
            response = self.client.models.generate_content(
                model="models/gemini-3-flash-preview",
                contents=contents,
                config={
                    "system_instruction": system_prompt
                }
            )
            
            if not response or not response.text:
                print("Warning: Gemini returned an empty response.")
                return "I'm sorry, I couldn't generate a response at this time. Please try rephrasing your question."
                
            return response.text
        except Exception as e:
            print(f"Gemini API Error: {e}")
            raise e

chat_service = ChatService()
