import faiss
import numpy as np
import os
import json
from ..ai.embedding_service import embedding_service

class VectorStore:
    def __init__(self, index_path="./faiss_index"):
        self.index_path = index_path
        self.dimension = 3072  # Gemini gemini-embedding-001
        self.index = faiss.IndexFlatL2(self.dimension)
        self.metadata = []
        
        if os.path.exists(f"{index_path}.index"):
            self.load()

    def add_texts(self, texts: list[str], metadatas: list[dict]):
        if not texts:
            return
            
        embeddings = embedding_service.get_embeddings(texts)
        embeddings_np = np.array(embeddings).astype('float32')
        
        self.index.add(embeddings_np)
        self.metadata.extend(metadatas)
        self.save()

    def search(self, query: str, k=5):
        # Safety check: If index is empty, return empty results
        if not self.index or self.index.ntotal == 0:
            return []
            
        try:
            query_embedding = embedding_service.get_query_embedding(query)
            if not query_embedding:
                return []
                
            query_embedding_np = np.array([query_embedding]).astype('float32')
            
            distances, indices = self.index.search(query_embedding_np, k)
            
            results = []
            for i, idx in enumerate(indices[0]):
                if idx != -1 and idx < len(self.metadata):
                    results.append({
                        "metadata": self.metadata[idx],
                        "score": float(distances[0][i])
                    })
            return results
        except Exception as e:
            print(f"Vector search error: {e}")
            return []

    def save(self):
        faiss.write_index(self.index, f"{self.index_path}.index")
        with open(f"{self.index_path}.meta", "w") as f:
            json.dump(self.metadata, f)

    def load(self):
        self.index = faiss.read_index(f"{self.index_path}.index")
        with open(f"{self.index_path}.meta", "r") as f:
            self.metadata = json.load(f)

vector_store = VectorStore()
