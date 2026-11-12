import pickle
import base64
from typing import Optional
import redis.asyncio as aioredis
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.checkpoint.base import Checkpoint, CheckpointMetadata, CheckpointTuple

class RedisCachedPostgresSaver:
    def __init__(self, postgres_saver: AsyncPostgresSaver, redis_client: aioredis.Redis, ttl_seconds: int = 3600):
        self.pg = postgres_saver
        self.redis = redis_client
        self.ttl = ttl_seconds

    def _make_redis_key(self, config: dict) -> str:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_id = config["configurable"].get("checkpoint_id", "latest")
        return f"langgraph:checkpoint:{thread_id}:{checkpoint_id}"

    async def aget_tuple(self, config: dict) -> Optional[CheckpointTuple]:
        redis_key = self._make_redis_key(config)
        try:
            cached_data = await self.redis.get(redis_key)
            if cached_data:
                return pickle.loads(base64.b64decode(cached_data))
        except Exception:
            pass

        checkpoint_tuple = await self.pg.aget_tuple(config)
        if checkpoint_tuple:
            try:
                serialized = base64.b64encode(pickle.dumps(checkpoint_tuple)).decode('utf-8')
                await self.redis.setex(redis_key, self.ttl, serialized)
            except Exception:
                pass
        return checkpoint_tuple

    async def aput(self, config: dict, checkpoint: Checkpoint, metadata: CheckpointMetadata, new_versions: dict) -> dict:
        res_config = await self.pg.aput(config, checkpoint, metadata, new_versions)
        latest_tuple = CheckpointTuple(config=res_config, checkpoint=checkpoint, metadata=metadata, parent_config=config)
        redis_key = self._make_redis_key(res_config)
        try:
            serialized = base64.b64encode(pickle.dumps(latest_tuple)).decode('utf-8')
            await self.redis.setex(redis_key, self.ttl, serialized)
        except Exception:
            pass
        return res_config

    async def aput_writes(self, config: dict, writes: list, task_id: str) -> None:
        await self.pg.aput_writes(config, writes, task_id)
