from typing import Annotated

from fastapi import Depends, Request
from qdrant_client import AsyncQdrantClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.services.openai_client import OpenAIService


def get_openai(request: Request) -> OpenAIService:
    return request.app.state.openai


def get_qdrant(request: Request) -> AsyncQdrantClient:
    return request.app.state.qdrant


SessionDep = Annotated[AsyncSession, Depends(get_session)]
OpenAIDep = Annotated[OpenAIService, Depends(get_openai)]
QdrantDep = Annotated[AsyncQdrantClient, Depends(get_qdrant)]
