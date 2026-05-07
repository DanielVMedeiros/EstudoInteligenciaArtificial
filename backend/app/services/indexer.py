import json
import uuid
from datetime import datetime, timezone  # timezone used to get UTC then strip tzinfo

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import PointStruct
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import IndexResult, Receita, ReceitaChunk
from app.services.openai_client import OpenAIService

BATCH_SIZE = 50


async def index_chunks(
    session: AsyncSession,
    openai: OpenAIService,
    qdrant: AsyncQdrantClient,
) -> IndexResult:
    rows = (
        await session.execute(
            select(ReceitaChunk, Receita)
            .join(Receita, ReceitaChunk.receita_id == Receita.id)
            .where(ReceitaChunk.qdrant_point_id.is_(None))
        )
    ).all()

    indexed = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        texts = [chunk.text for chunk, _ in batch]
        vectors = await openai.embed_texts(texts)

        points: list[PointStruct] = []
        for j, (chunk, receita) in enumerate(batch):
            point_id = str(uuid.uuid4())
            tags: list[str] = json.loads(receita.tags) if receita.tags else []
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vectors[j].tolist(),
                    payload={
                        "chunk_id": chunk.id,
                        "receita_id": receita.receita_id,
                        "receita_pk": receita.id,
                        "titulo": receita.titulo,
                        "categoria": receita.categoria,
                        "tempo_minutos": receita.tempo_minutos,
                        "tags": tags,
                        "chunk_type": chunk.chunk_type,
                        "text": chunk.text,
                    },
                )
            )
            chunk.qdrant_point_id = point_id
            chunk.embedded_at = datetime.now(timezone.utc).replace(tzinfo=None)

        await qdrant.upsert(collection_name=settings.qdrant_collection, points=points)
        indexed += len(batch)

    await session.commit()
    return IndexResult(chunks_indexados=indexed)
