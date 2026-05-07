from __future__ import annotations

import json
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class CategoriaEnum(str, Enum):
    sobremesa = "sobremesa"
    prato_principal = "prato_principal"
    bebida = "bebida"
    lanche = "lanche"


class ChunkTypeEnum(str, Enum):
    titulo_resumo = "titulo_resumo"
    ingredientes = "ingredientes"
    modo_preparo = "modo_preparo"


class Receita(SQLModel, table=True):
    __tablename__ = "receita"

    id: Optional[int] = Field(default=None, primary_key=True)
    receita_id: str = Field(unique=True, index=True)
    titulo: str
    categoria: str
    tempo_minutos: int
    ingredientes: str
    modo_preparo: str
    tags: str
    row_hash: str

    def get_ingredientes(self) -> list[str]:
        return json.loads(self.ingredientes)

    def get_tags(self) -> list[str]:
        return json.loads(self.tags)


class ReceitaChunk(SQLModel, table=True):
    __tablename__ = "receita_chunk"

    id: Optional[int] = Field(default=None, primary_key=True)
    receita_id: int = Field(foreign_key="receita.id", index=True)
    chunk_type: str
    text: str
    qdrant_point_id: Optional[str] = Field(default=None, index=True)
    embedded_at: Optional[datetime] = None


# --- Pydantic request / response schemas ---

class QueryFilters(BaseModel):
    categoria: Optional[str] = None
    tempo_max: Optional[int] = None
    tags_qualquer: Optional[list[str]] = None


class QueryRequest(BaseModel):
    pergunta: str
    filtros: Optional[QueryFilters] = None


class CitationItem(BaseModel):
    n: int
    receita_id: str
    titulo: str
    trecho: str


class QueryResponse(BaseModel):
    resposta: str
    citacoes: list[CitationItem]


class IngestResult(BaseModel):
    criadas: int = 0
    atualizadas: int = 0
    ignoradas: int = 0
    erros: list[str] = []


class ChunkResult(BaseModel):
    receitas_processadas: int
    chunks_criados: int


class IndexResult(BaseModel):
    chunks_indexados: int
