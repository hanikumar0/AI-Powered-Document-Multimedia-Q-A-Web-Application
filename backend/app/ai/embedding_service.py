from .gemini_client import gemini_client
import numpy as np

class EmbeddingService:
    def __init__(self, model_name="models/gemini-embedding-2"): # Using a supported model from the list
        self.client = gemini_client.get_client()
        self.model_name = model_name

    def get_embeddings(self, texts: list[str]):
        """
        Generates embeddings for a list of texts using Google Gemini.
        """
        try:
            response = self.client.models.embed_content(
                model=self.model_name,
                contents=texts,
                config={
                    "task_type": "RETRIEVAL_DOCUMENT"
                }
            )
            # The new SDK returns a list of embeddings in response.embeddings
            return [e.values for e in response.embeddings]
        except Exception as e:
            print(f"Embedding error: {e}")
            return []

    def get_query_embedding(self, query: str):
        """
        Generates an embedding for a search query.
        """
        try:
            response = self.client.models.embed_content(
                model=self.model_name,
                contents=query,
                config={
                    "task_type": "RETRIEVAL_QUERY"
                }
            )
            return response.embeddings[0].values
        except Exception as e:
            print(f"Query embedding error: {e}")
            return []

embedding_service = EmbeddingService()
