import pytest
from app.services.cache_service import CacheService
from unittest.mock import AsyncMock, patch
import json

@pytest.mark.asyncio
async def test_cache_service_get_set():
    cache = CacheService()
    cache.redis = AsyncMock()
    
    # Test SET
    await cache.set("test_key", {"data": "val"}, expire=10)
    cache.redis.set.assert_called_with("test_key", json.dumps({"data": "val"}), ex=10)
    
    # Test GET
    cache.redis.get.return_value = json.dumps({"data": "val"})
    result = await cache.get("test_key")
    assert result == {"data": "val"}
    
    # Test GET None
    cache.redis.get.return_value = None
    result = await cache.get("missing")
    assert result is None

def test_generate_key():
    cache = CacheService()
    key1 = cache.generate_key("prefix", "data")
    key2 = cache.generate_key("prefix", "data")
    key3 = cache.generate_key("prefix", "different")
    
    assert key1 == key2
    assert key1 != key3
    assert key1.startswith("prefix:")
