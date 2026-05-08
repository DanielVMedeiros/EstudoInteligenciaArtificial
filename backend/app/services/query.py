from qdrant_client import AsyncQdrantClient
from qdrant_client.models import FieldCondition, Filter, MatchAny, MatchValue, Range
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import CitationItem, QueryFilters, QueryRequest, QueryResponse
from app.services.openai_client import OpenAIService


def _build_filter(filtros: QueryFilters | None) -> Filter | None:
    if not filtros:
        return None

    must: list = []

    if filtros.categoria:
        must.append(FieldCondition(key="categoria", match=MatchValue(value=filtros.categoria)))

    if filtros.tempo_max is not None:
        must.append(FieldCondition(key="tempo_minutos", range=Range(lte=filtros.tempo_max)))

    if filtros.tags_qualquer:
        must.append(FieldCondition(key="tags", match=MatchAny(any=filtros.tags_qualquer)))

    return Filter(must=must) if must else None


async def execute_query(
    request: QueryRequest,
    session: AsyncSession,
    openai: OpenAIService,
    qdrant: AsyncQdrantClient,
) -> QueryResponse:
    query_vector = await openai.embed_text(request.pergunta)
    qdrant_filter = _build_filter(request.filtros)

    result = await qdrant.query_points(
        collection_name=settings.qdrant_collection,
        query=query_vector.tolist(),
        query_filter=qdrant_filter,
        limit=6,
        with_payload=True,
    )
    hits = result.points

    if not hits:
        return QueryResponse(
            resposta=(
                "Não encontrei receita que case com sua busca no acervo. "
                "Tente ajustar os filtros ou reformular a pergunta."
            ),
            citacoes=[],
        )

    seen: set[str] = set()
    unique_hits = []
    for hit in hits:
        rid = hit.payload["receita_id"]
        if rid not in seen:
            seen.add(rid)
            unique_hits.append(hit)

    context_blocks: list[str] = []
    for i, hit in enumerate(unique_hits, start=1):
        p = hit.payload
        block = (
            f"[{i}] {p['titulo']}\n"
            f"Categoria: {p['categoria']} | Tempo: {p['tempo_minutos']} min"
            f" | Tags: {', '.join(p.get('tags', []))}\n"
            f"Conteúdo: {p['text']}"
        )
        context_blocks.append(block)

    resposta = await openai.generate_answer(request.pergunta, context_blocks)

    citacoes = [
        CitationItem(
            n=i,
            receita_id=hit.payload["receita_id"],
            titulo=hit.payload["titulo"],
            trecho=hit.payload["text"][:200],
        )
        for i, hit in enumerate(unique_hits, start=1)
    ]

    return QueryResponse(resposta=resposta, citacoes=citacoes)
