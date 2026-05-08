import json

import numpy as np
import pytest
import pytest_asyncio
from sqlmodel import SQLModel
from unittest.mock import AsyncMock, MagicMock

from app.models import QueryFilters, QueryRequest
from app.services.chunker import create_chunks
from app.services.indexer import index_chunks
from app.services.ingestion import ingest_csv
from app.services.query import execute_query

CSV_CONTENT = b"""id,titulo,categoria,tempo_minutos,ingredientes,modo_preparo,tags
rec-t01,Mousse de Chocolate,sobremesa,20,cacau;ovos;acucar,Bata e leve a geladeira por 2h.,sem_lactose
rec-t02,Smoothie Verde,bebida,5,banana;espinafre;leite vegetal,Bata tudo ate homogeneizar.,vegano;sem_lactose
"""

FAKE_VECTOR = [0.1] * 1536


@pytest_asyncio.fixture(autouse=True)
async def clean_tables(engine):
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)


@pytest.mark.asyncio
async def test_ingest_creates_records(session):
    result = await ingest_csv(CSV_CONTENT, session)
    assert result.criadas == 2
    assert result.erros == []


@pytest.mark.asyncio
async def test_ingest_idempotent(session):
    await ingest_csv(CSV_CONTENT, session)
    result = await ingest_csv(CSV_CONTENT, session)
    assert result.criadas == 0
    assert result.ignoradas == 2


@pytest.mark.asyncio
async def test_full_pipeline(session):
    # 1. Ingest
    ingest_result = await ingest_csv(CSV_CONTENT, session)
    assert ingest_result.criadas == 2

    # 2. Chunk
    chunk_result = await create_chunks(session)
    assert chunk_result.receitas_processadas == 2
    assert chunk_result.chunks_criados == 6

    # 3. Chunk again — retomável, deve ser no-op
    chunk_result2 = await create_chunks(session)
    assert chunk_result2.receitas_processadas == 0

    # 4. Index (mocked OpenAI + Qdrant real embeddings mocked)
    mock_openai = MagicMock()
    mock_openai.embed_texts = AsyncMock(
        return_value=np.array([FAKE_VECTOR] * 6, dtype=np.float32)
    )
    mock_qdrant = MagicMock()
    mock_qdrant.upsert = AsyncMock()

    index_result = await index_chunks(session, mock_openai, mock_qdrant)
    assert index_result.chunks_indexados == 6
    assert mock_qdrant.upsert.called

    # 5. Index again — retomável, deve indexar 0 (todos já têm qdrant_point_id)
    index_result2 = await index_chunks(session, mock_openai, mock_qdrant)
    assert index_result2.chunks_indexados == 0

    # 6. Query (mocked OpenAI + mocked Qdrant search)
    mock_hit = MagicMock()
    mock_hit.payload = {
        "receita_id": "rec-t01",
        "titulo": "Mousse de Chocolate",
        "categoria": "sobremesa",
        "tempo_minutos": 20,
        "tags": ["sem_lactose"],
        "text": "Título: Mousse de Chocolate. Categoria: sobremesa. Tempo: 20 minutos.",
        "chunk_type": "titulo_resumo",
    }
    mock_openai.embed_text = AsyncMock(
        return_value=np.array(FAKE_VECTOR, dtype=np.float32)
    )
    mock_openai.generate_answer = AsyncMock(
        return_value="A receita [1] é ideal para sua busca."
    )
    mock_qdrant.search = AsyncMock(return_value=[mock_hit])

    response = await execute_query(
        QueryRequest(
            pergunta="sobremesa sem lactose",
            filtros=QueryFilters(categoria="sobremesa"),
        ),
        session,
        mock_openai,
        mock_qdrant,
    )

    assert "receita" in response.resposta.lower()
    assert len(response.citacoes) == 1
    assert response.citacoes[0].receita_id == "rec-t01"
    assert response.citacoes[0].n == 1
