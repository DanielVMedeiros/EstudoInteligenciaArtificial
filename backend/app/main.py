from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.database import create_tables
from app.qdrant_setup import ensure_collection, get_qdrant_client
from app.services.openai_client import OpenAIService


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    qdrant = get_qdrant_client()
    await ensure_collection(qdrant)
    app.state.openai = OpenAIService()
    app.state.qdrant = qdrant
    yield
    await qdrant.close()


app = FastAPI(
    title="Buscador Inteligente de Receitas",
    description="RAG em receitas culinárias com citações rastreáveis.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
