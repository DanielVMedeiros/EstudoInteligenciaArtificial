from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    groq_api_key: str = ""
    llm_model: str = "llama-3.3-70b-versatile"

    # Embeddings via API OpenAI-compatible (Jina por padrão) — sem torch local.
    # Funciona com qualquer provider que exponha POST {base}/embeddings no
    # schema da OpenAI: Jina, OpenAI, Nebius, Together, DeepInfra, etc.
    embedding_api_base: str = "https://api.jina.ai/v1"
    embedding_api_key: str = ""
    embedding_model: str = "jina-embeddings-v3"
    embedding_dim: int = 1024

    database_url: str = "postgresql+asyncpg://recipe:recipe@localhost:5432/recipe"
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_api_key: str = ""
    qdrant_https: bool = False
    qdrant_collection: str = "receitas"

    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

    @field_validator("database_url", mode="before")
    @classmethod
    def _force_asyncpg_driver(cls, v: str) -> str:
        """Provedores gerenciados (Render, etc.) entregam a URL como
        'postgresql://...'. O app e o Alembic precisam do driver asyncpg.
        Normaliza o esquema e remove o sslmode (asyncpg não aceita esse
        parâmetro na query string; conexão interna não precisa dele)."""
        if not isinstance(v, str) or not v:
            return v
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://"):]
        if v.startswith("postgresql://"):
            v = "postgresql+asyncpg://" + v[len("postgresql://"):]
        for sep in ("?sslmode=", "&sslmode="):
            if sep in v:
                v = v.split(sep)[0]
        return v

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, v):
        """Aceita CORS_ORIGINS como string separada por vírgula
        (ex.: 'https://app.vercel.app,https://meu-dominio.com')."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
