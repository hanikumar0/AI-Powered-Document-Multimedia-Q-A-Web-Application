from .gemini_client import gemini_client

class ChatService:
    def __init__(self):
        self.client = gemini_client.get_client()

    async def generate_response(self, message: str, context: str = "", attached_files: list[str] = None, history: list[dict] = None):
        # Implementation remains for backward compatibility or non-streamed calls
        contents, system_prompt = self._prepare_payload(message, context, attached_files, history)
        
        try:
            response = self.client.models.generate_content(
                model="models/gemini-3-flash-preview",
                contents=contents,
                config={"system_instruction": system_prompt}
            )
            return response.text if response and response.text else "Empty response."
        except Exception as e:
            print(f"Gemini API Error: {e}")
            raise e

    async def generate_streaming_response(self, message: str, session_id: str, current_time: float = None, media_id: str = None, context: str = "", attached_files: list[str] = None, history: list[dict] = None):
        contents, system_prompt = self._prepare_payload(message, context, attached_files, history, current_time)
        
        try:
            # Using the genai.Client streaming syntax
            response_stream = self.client.models.generate_content_stream(
                model="models/gemini-3-flash-preview",
                contents=contents,
                config={"system_instruction": system_prompt}
            )
            
            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            print(f"Gemini Streaming Error: {e}")
            yield f"\n[Error: {str(e)}]"

    def _prepare_payload(self, message: str, context: str = "", attached_files: list[str] = None, history: list[dict] = None, current_time: float = None):
        files_str = ", ".join(attached_files) if attached_files else "None"
        
        time_context = f"The user is CURRENTLY watching the media at timestamp {current_time}." if current_time is not None else ""
        
        system_prompt = f"""
        You are a senior AI multimedia intelligence and document processing system. Your primary goal is ACCURACY and GROUNDING.
        The user has attached the following files to this conversation: {files_str}.
        {time_context}
        
        MULTIMEDIA INTELLIGENCE PROTOCOL:
        1. If you are provided with transcription segments containing timestamps (e.g., "[02:15]"), you MUST cite the exact timestamp when answering about that segment.
        2. Format timestamps as [MM:SS] or [HH:MM:SS]. These will become interactive links for the user.
        3. Place the timestamp citation immediately after the relevant fact (e.g., "The speaker mentioned a 20% budget increase [05:12]").
        4. If a video/audio file is selected, prioritize these time-based citations over general summaries.
        5. If the user asks about "right now", "just said", or "at this point", refer to the content near the CURRENT playback timestamp provided above.
        
        DOCUMENT INTELLIGENCE PROTOCOL:
        1. For PDFs, include a citation in brackets, e.g., [File: name.pdf, Page: 1].
        2. If the information is not explicitly present in the provided context, you must say:
           "I could not find that information in the uploaded content."
        3. Do NOT invent, infer, or hallucinate any information or timestamps.
        
        GENERAL INSTRUCTIONS:
        - Be professional, concise, and purely factual. 
        - If the context is empty but files are attached, acknowledge the files and ask for a specific question about them.
        """
        
        contents = []
        if history:
            for msg in history:
                contents.append({
                    "role": "user" if msg["role"] == "user" else "model",
                    "parts": [{"text": msg["content"]}]
                })
        
        current_content = ""
        if context:
            current_content += f"Context from attached files:\n{context}\n\n"
        current_content += f"User Question: {message}"
        
        contents.append({
            "role": "user",
            "parts": [{"text": current_content}]
        })
        
        return contents, system_prompt

chat_service = ChatService()
