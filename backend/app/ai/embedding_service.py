from .gemini_client import gemini_client
import numpy as np
from ..services.cache_service import cache_service

class EmbeddingService:
    def __init__(self, model_name="models/gemini-embedding-001"):
        self.client = gemini_client.get_client()
        self.model_name = model_name

    async def get_embeddings(self, texts: list[str]):
        """
        Generates embeddings for a list of texts using Google Gemini with Redis caching.
        """
        if not texts:
            return []
            
        results = [None] * len(texts)
        to_embed_indices = []
        to_embed_texts = []
        
        # 1. Check Cache
        for i, text in enumerate(texts):
            cache_key = cache_service.generate_key("embedding", text)
            cached = await cache_service.get(cache_key)
            if cached:
                results[i] = cached
            else:
                to_embed_indices.append(i)
                to_embed_texts.append(text)
        
        # 2. Call Gemini for missing embeddings
        if to_embed_texts:
            try:
                response = self.client.models.embed_content(
                    model=self.model_name,
                    contents=to_embed_texts,
                    config={"task_type": "RETRIEVAL_DOCUMENT"}
                )
                
                for i, embedding_obj in enumerate(response.embeddings):
                    idx = to_embed_indices[i]
                    emb_values = embedding_obj.values
                    results[idx] = emb_values
                    
                    # 3. Save to Cache (Long TTL for embeddings)
                    cache_key = cache_service.generate_key("embedding", to_embed_texts[i])
                    await cache_service.set(cache_key, emb_values, expire=86400 * 30) # 30 days
                    
            except Exception as e:
                print(f"Embedding error: {e}")
                # For failed embeddings, return zero vectors or similar? 
                # Let's just return empty list to fail gracefully
                return []
                
        return results

    async def get_query_embedding(self, query: str):
        """
        Generates an embedding for a search query with Redis caching.
        """
        cache_key = cache_service.generate_key("query_emb", query)
        cached = await cache_service.get(cache_key)
        if cached:
            return cached
            
        try:
            response = self.client.models.embed_content(
                model=self.model_name,
                contents=query,
                config={"task_type": "RETRIEVAL_QUERY"}
            )
            emb_values = response.embeddings[0].values
            await cache_service.set(cache_key, emb_values, expire=3600) # 1 hour for queries
            return emb_values
        except Exception as e:
            print(f"Query embedding error: {e}")
            return []

embedding_service = EmbeddingService()
