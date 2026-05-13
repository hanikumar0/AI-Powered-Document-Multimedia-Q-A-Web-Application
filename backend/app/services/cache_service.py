import json
import redis.asyncio as redis
from typing import Optional, Any
import os
import hashlib

class CacheService:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis: Optional[redis.Redis] = None

    async def connect(self):
        try:
            self.redis = redis.from_url(self.redis_url, encoding="utf-8", decode_responses=True)
            await self.redis.ping()
            print(f"Connected to Redis at {self.redis_url}")
        except Exception as e:
            print(f"Failed to connect to Redis: {e}")
            self.redis = None

    async def get(self, key: str) -> Optional[Any]:
        if not self.redis:
            return None
        try:
            data = await self.redis.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            print(f"Redis GET error: {e}")
            return None

    async def set(self, key: str, value: Any, expire: int = 3600):
        if not self.redis:
            return
        try:
            await self.redis.set(key, json.dumps(value), ex=expire)
        except Exception as e:
            print(f"Redis SET error: {e}")

    def generate_key(self, prefix: str, data: str) -> str:
        """Generate a unique cache key based on a prefix and data hash."""
        data_hash = hashlib.md5(data.encode()).hexdigest()
        return f"{prefix}:{data_hash}"

cache_service = CacheService()
