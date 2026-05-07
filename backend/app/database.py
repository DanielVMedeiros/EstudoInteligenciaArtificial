from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_session():
    async with AsyncSessionLocal() as session:
        yield session


async def create_tables() -> None:
    import app.models  # noqa: F401 — populate SQLModel metadata

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
