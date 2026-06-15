from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams

from app.config import settings

VECTOR_SIZE = settings.embedding_dim


def get_qdrant_client() -> AsyncQdrantClient:
    return AsyncQdrantClient(
        host=settings.qdrant_host,
        port=settings.qdrant_port,
        api_key=settings.qdrant_api_key or None,
        https=settings.qdrant_https,
    )

async def ensure_collection(client: AsyncQdrantClient) -> None:
    collections = await client.get_collections()
    exists = any(c.name == settings.qdrant_collection for c in collections.collections)

    if not exists:
        await client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
        for field, schema in [
            ("categoria", "keyword"),
            ("tempo_minutos", "integer"),
            ("tags", "keyword"),
            ("chunk_type", "keyword"),
        ]:
            await client.create_payload_index(settings.qdrant_collection, field, schema)
