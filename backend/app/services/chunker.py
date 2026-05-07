import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ChunkResult, Receita, ReceitaChunk


def _build_chunks(receita: Receita) -> list[tuple[str, str]]:
    ingredientes: list[str] = json.loads(receita.ingredientes)
    tags: list[str] = json.loads(receita.tags)

    titulo_resumo = (
        f"Título: {receita.titulo}. "
        f"Categoria: {receita.categoria}. "
        f"Tempo: {receita.tempo_minutos} minutos. "
        f"Tags: {', '.join(tags) or 'nenhuma'}."
    )

    return [
        ("titulo_resumo", titulo_resumo),
        ("ingredientes", ", ".join(ingredientes)),
        ("modo_preparo", receita.modo_preparo),
    ]


async def create_chunks(session: AsyncSession) -> ChunkResult:
    already_chunked = select(ReceitaChunk.receita_id).distinct()
    result = await session.execute(
        select(Receita).where(Receita.id.notin_(already_chunked))
    )
    receitas = result.scalars().all()

    chunks_criados = 0
    for receita in receitas:
        for chunk_type, text in _build_chunks(receita):
            session.add(ReceitaChunk(
                receita_id=receita.id,
                chunk_type=chunk_type,
                text=text,
            ))
            chunks_criados += 1

    await session.commit()
    return ChunkResult(receitas_processadas=len(receitas), chunks_criados=chunks_criados)
