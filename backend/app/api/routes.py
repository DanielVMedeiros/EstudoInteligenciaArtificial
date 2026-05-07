import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.api.deps import OpenAIDep, QdrantDep, SessionDep

logger = logging.getLogger(__name__)
from app.models import ChunkResult, IndexResult, IngestResult, QueryRequest, QueryResponse
from app.services.chunker import create_chunks
from app.services.indexer import index_chunks
from app.services.ingestion import ingest_csv
from app.services.query import execute_query

router = APIRouter(tags=["receitas"])


@router.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/pipelines/ingest-csv", response_model=IngestResult)
async def pipeline_ingest_csv(
    session: SessionDep,
    file: UploadFile = File(...),
) -> IngestResult:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Envie um arquivo CSV")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Arquivo vazio")
    return await ingest_csv(content, session)


@router.post("/pipelines/chunk", response_model=ChunkResult)
async def pipeline_chunk(session: SessionDep) -> ChunkResult:
    return await create_chunks(session)


@router.post("/pipelines/index", response_model=IndexResult)
async def pipeline_index(
    session: SessionDep,
    openai: OpenAIDep,
    qdrant: QdrantDep,
) -> IndexResult:
    return await index_chunks(session, openai, qdrant)


@router.post("/query", response_model=QueryResponse)
async def query(
    body: QueryRequest,
    session: SessionDep,
    openai: OpenAIDep,
    qdrant: QdrantDep,
) -> QueryResponse:
    if not body.pergunta.strip():
        raise HTTPException(status_code=422, detail="Pergunta vazia")
    try:
        return await execute_query(body, session, openai, qdrant)
    except Exception as exc:
        logger.exception("Erro em /query: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
