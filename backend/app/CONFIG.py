from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    groq_api_key: str = ""
    llm_model: str = "llama-3.3-70b-versatile"

    # Modelo local de embeddings (sentence-transformers, sem API key)
    embedding_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    embedding_dim: int = 384

    database_url: str = "postgresql+asyncpg://recipe:recipe@localhost:5432/recipe"
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_api_key: str = ""
    qdrant_https: bool = False
    qdrant_collection: str = "receitas"

    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
