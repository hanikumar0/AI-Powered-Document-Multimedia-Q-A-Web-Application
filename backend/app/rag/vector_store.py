import faiss
import numpy as np
import os
import json
from ..ai.embedding_service import embedding_service

class VectorStore:
    def __init__(self, index_path="./faiss_index"):
        self.index_path = index_path
        self.dimension = 768  # Gemini gemini-embedding-001
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

    def search(self, query: str, k=5, file_ids: list[str] = None):
        # Safety check: If index is empty, return empty results
        if not self.index or self.index.ntotal == 0:
            return []
            
        # If file_ids is provided as an empty list, it means no files are attached to this conversation
        if file_ids is not None and len(file_ids) == 0:
            return []
            
        SIMILARITY_THRESHOLD = 1.5  # Adjust based on empirical testing with gemini-embedding-001
        
        try:
            query_embedding = embedding_service.get_query_embedding(query)
            if not query_embedding:
                return []
                
            query_embedding_np = np.array([query_embedding]).astype('float32')
            
            # Increase k significantly if we are filtering, to ensure we get relevant results from the specific files
            # This is a safety measure to avoid "missing" relevant chunks because they are pushed down by irrelevant ones from other files
            search_k = max(k * 20, 200) if file_ids else k
            distances, indices = self.index.search(query_embedding_np, search_k)
            
            results = []
            for i, idx in enumerate(indices[0]):
                if idx != -1 and idx < len(self.metadata):
                    dist = float(distances[0][i])
                    
                    # Confidence check: Skip if distance is too high (L2 distance)
                    if dist > SIMILARITY_THRESHOLD:
                        continue
                        
                    meta = self.metadata[idx]
                    
                    # Strict isolation: Filter by file_id if provided
                    if file_ids is not None and meta.get("file_id") not in file_ids:
                        continue
                        
                    results.append({
                        "metadata": meta,
                        "score": dist # Lower is better in L2
                    })
                    
                    if len(results) >= k:
                        break
            
            if not results:
                print(f"Warning: No confident results found for query '{query}' within allowed files.")
                
            return results
        except Exception as e:
            print(f"Vector search error: {e}")
            return []

    def get_all_content_for_files(self, file_ids: list[str]):
        """Helper to get all chunks for a specific set of files (useful for meta-queries)"""
        results = []
        for meta in self.metadata:
            if meta.get("file_id") in file_ids:
                results.append({
                    "metadata": meta,
                    "score": 0.0
                })
        return results

    def remove_file_data(self, file_id: str):
        """Removes all chunks and embeddings associated with a file_id."""
        new_metadata = [m for m in self.metadata if m.get("file_id") != file_id]
        if len(new_metadata) == len(self.metadata):
            return # Nothing to remove
            
        print(f"Removing data for file {file_id}. Rebuilding index...")
        self.metadata = new_metadata
        
        # Rebuild index from scratch
        self.index = faiss.IndexFlatL2(self.dimension)
        if self.metadata:
            texts = [m["text"] for m in self.metadata]
            embeddings = embedding_service.get_embeddings(texts)
            embeddings_np = np.array(embeddings).astype('float32')
            self.index.add(embeddings_np)
        
        self.save()

    def save(self):
        faiss.write_index(self.index, f"{self.index_path}.index")
        with open(f"{self.index_path}.meta", "w") as f:
            json.dump(self.metadata, f)

    def load(self):
        self.index = faiss.read_index(f"{self.index_path}.index")
        with open(f"{self.index_path}.meta", "r") as f:
            self.metadata = json.load(f)

vector_store = VectorStore()
