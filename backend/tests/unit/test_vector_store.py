import pytest
import numpy as np
import os
import shutil
from unittest.mock import MagicMock, patch, AsyncMock
from app.rag.vector_store import VectorStore

@pytest.fixture
def temp_index_dir():
    path = "./test_faiss_index"
    if os.path.exists(f"{path}.index"):
        os.remove(f"{path}.index")
    if os.path.exists(f"{path}.meta"):
        os.remove(f"{path}.meta")
    yield path
    if os.path.exists(f"{path}.index"):
        os.remove(f"{path}.index")
    if os.path.exists(f"{path}.meta"):
        os.remove(f"{path}.meta")

@pytest.fixture
def mock_embeddings():
    with patch("app.rag.vector_store.embedding_service") as mock_service:
        # Gemini embeddings are 768 dim
        mock_service.get_embeddings = AsyncMock(return_value=[[0.1] * 768])
        mock_service.get_query_embedding = AsyncMock(return_value=[0.1] * 768)
        yield mock_service

@pytest.mark.asyncio
async def test_add_and_search_texts(temp_index_dir, mock_embeddings):
    store = VectorStore(index_path=temp_index_dir)
    await store.add_texts(["Hello world"], [{"file_id": "1", "text": "Hello world"}])
    
    results = await store.search("Hello")
    assert len(results) == 1
    assert results[0]["metadata"]["file_id"] == "1"

@pytest.mark.asyncio
async def test_search_isolation(temp_index_dir, mock_embeddings):
    store = VectorStore(index_path=temp_index_dir)
    # Mock multiple embeddings
    mock_embeddings.get_embeddings.return_value = [[0.1] * 768, [0.9] * 768]
    
    await store.add_texts(
        ["Doc 1 content", "Doc 2 content"],
        [{"file_id": "file1", "text": "Doc 1 content"}, {"file_id": "file2", "text": "Doc 2 content"}]
    )
    
    # Search restricted to file1
    mock_embeddings.get_query_embedding.return_value = [0.1] * 768
    results = await store.search("content", file_ids=["file1"])
    assert len(results) == 1
    assert results[0]["metadata"]["file_id"] == "file1"

@pytest.mark.asyncio
async def test_remove_file_data(temp_index_dir, mock_embeddings):
    store = VectorStore(index_path=temp_index_dir)
    await store.add_texts(["Delete me"], [{"file_id": "to_delete", "text": "Delete me"}])
    assert store.index.ntotal == 1
    
    await store.remove_file_data("to_delete")
    assert store.index.ntotal == 0
    assert len(store.metadata) == 0
@pytest.mark.asyncio
async def test_add_texts_empty(temp_index_dir, mock_embeddings):
    store = VectorStore(index_path=temp_index_dir)
    await store.add_texts([], [])
    assert store.index.ntotal == 0

@pytest.mark.asyncio
async def test_search_empty_index(temp_index_dir):
    store = VectorStore(index_path=temp_index_dir)
    results = await store.search("query")
    assert results == []

@pytest.mark.asyncio
async def test_search_empty_file_ids(temp_index_dir, mock_embeddings):
    store = VectorStore(index_path=temp_index_dir)
    await store.add_texts(["text"], [{"file_id": "1", "text": "text"}])
    results = await store.search("query", file_ids=[])
    assert results == []

@pytest.mark.asyncio
async def test_search_query_embedding_failure(temp_index_dir, mock_embeddings):
    store = VectorStore(index_path=temp_index_dir)
    await store.add_texts(["text"], [{"file_id": "1", "text": "text"}])
    mock_embeddings.get_query_embedding.return_value = None
    results = await store.search("query")
    assert results == []

@pytest.mark.asyncio
async def test_search_similarity_threshold(temp_index_dir, mock_embeddings):
    store = VectorStore(index_path=temp_index_dir)
    # Distance will be high because query embedding is far from stored embedding
    mock_embeddings.get_embeddings.return_value = [[0.0] * 768]
    mock_embeddings.get_query_embedding.return_value = [10.0] * 768 # High distance
    
    await store.add_texts(["far"], [{"file_id": "1", "text": "far"}])
    results = await store.search("query")
    assert results == []

@pytest.mark.asyncio
async def test_get_all_content_for_files(temp_index_dir, mock_embeddings):
    store = VectorStore(index_path=temp_index_dir)
    await store.add_texts(["t1", "t2"], [{"file_id": "f1", "text": "t1"}, {"file_id": "f2", "text": "t2"}])
    res = store.get_all_content_for_files(["f1"])
    assert len(res) == 1
    assert res[0]["metadata"]["file_id"] == "f1"

@pytest.mark.asyncio
async def test_remove_file_data_nonexistent(temp_index_dir, mock_embeddings):
    store = VectorStore(index_path=temp_index_dir)
    await store.add_texts(["t1"], [{"file_id": "f1", "text": "t1"}])
    await store.remove_file_data("f2")
    assert store.index.ntotal == 1

@pytest.mark.asyncio
async def test_search_error_handling(temp_index_dir, mock_embeddings):
    store = VectorStore(index_path=temp_index_dir)
    await store.add_texts(["t1"], [{"file_id": "f1", "text": "t1"}])
    mock_embeddings.get_query_embedding.side_effect = Exception("Search error")
    results = await store.search("query")
    assert results == []

@pytest.mark.asyncio
async def test_search_file_id_filter_skip(temp_index_dir, mock_embeddings):
    store = VectorStore(index_path=temp_index_dir)
    mock_embeddings.get_embeddings.return_value = [[0.1] * 768, [0.1] * 768]
    await store.add_texts(["t1", "t2"], [{"file_id": "f1", "text": "t1"}, {"file_id": "f2", "text": "t2"}])
    
    # Search for f1 only, should skip f2
    results = await store.search("query", file_ids=["f1"], k=10)
    assert len(results) == 1
    assert results[0]["metadata"]["file_id"] == "f1"

@pytest.mark.asyncio
async def test_search_limit_break(temp_index_dir, mock_embeddings):
    store = VectorStore(index_path=temp_index_dir)
    mock_embeddings.get_embeddings.return_value = [[0.1] * 768, [0.1] * 768]
    await store.add_texts(["t1", "t2"], [{"file_id": "f1", "text": "t1"}, {"file_id": "f1", "text": "t2"}])
    
    # k=1 should break after first result
    results = await store.search("query", k=1)
    assert len(results) == 1

@pytest.mark.asyncio
async def test_remove_file_data_rebuild_partial(temp_index_dir, mock_embeddings):
    store = VectorStore(index_path=temp_index_dir)
    mock_embeddings.get_embeddings.side_effect = lambda texts: [[0.1] * 768 for _ in texts]
    await store.add_texts(["t1", "t2"], [{"file_id": "f1", "text": "t1"}, {"file_id": "f2", "text": "t2"}])
    
    # Remove f1, f2 should remain and index should be rebuilt
    await store.remove_file_data("f1")
    assert store.index.ntotal == 1
    assert store.metadata[0]["file_id"] == "f2"
