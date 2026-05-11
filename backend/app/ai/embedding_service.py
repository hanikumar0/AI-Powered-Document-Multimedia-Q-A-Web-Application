import google.generativeai as genai
import numpy as np

class EmbeddingService:
    def __init__(self, model_name="models/gemini-embedding-001"):
        self.model_name = model_name

    def get_embeddings(self, texts: list[str]):
        """
        Generates embeddings for a list of texts using Google Gemini.
        """
        response = genai.embed_content(
            model=self.model_name,
            content=texts,
            task_type="retrieval_document"
        )
        return response['embedding']

    def get_query_embedding(self, query: str):
        """
        Generates an embedding for a search query.
        """
        response = genai.embed_content(
            model=self.model_name,
            content=query,
            task_type="retrieval_query"
        )
        return response['embedding']

embedding_service = EmbeddingService()
