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

    if exists:
        info = await client.get_collection(settings.qdrant_collection)
        current_size = info.config.params.vectors.size
        if current_size != VECTOR_SIZE:
            raise RuntimeError(
                f"A collection '{settings.qdrant_collection}' existe com dimensão "
                f"{current_size}, mas EMBEDDING_DIM={VECTOR_SIZE}. Apague a collection "
                f"no Qdrant (ou use outro nome em QDRANT_COLLECTION) e rode o pipeline "
                f"de indexação de novo."
            )
        return

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
