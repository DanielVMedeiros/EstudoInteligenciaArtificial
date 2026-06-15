import asyncio
from functools import partial

import httpx
import numpy as np
from groq import Groq

from app.config import settings
from app.prompts.search import SEARCH_INSTRUCTIONS


class OpenAIService:
    """Mantém o nome para não alterar imports.

    LLM: Groq. Embeddings: API HTTP OpenAI-compatible (Jina por padrão),
    sem sentence-transformers/torch — roda folgado em 512 MB de RAM.
    """

    def __init__(self) -> None:
        self._groq: Groq | None = None

    @property
    def groq(self) -> Groq:
        if self._groq is None:
            if not settings.groq_api_key:
                raise RuntimeError("GROQ_API_KEY não configurada")
            self._groq = Groq(api_key=settings.groq_api_key)
        return self._groq

    async def embed_texts(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.empty((0, settings.embedding_dim), dtype=np.float32)
        if not settings.embedding_api_key:
            raise RuntimeError("EMBEDDING_API_KEY não configurada")

        url = f"{settings.embedding_api_base.rstrip('/')}/embeddings"
        payload = {"model": settings.embedding_model, "input": texts}
        headers = {"Authorization": f"Bearer {settings.embedding_api_key}"}

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload, headers=headers)

        if resp.status_code != 200:
            raise RuntimeError(
                f"Erro na API de embeddings ({resp.status_code}): {resp.text[:300]}"
            )

        data = resp.json()["data"]
        # ordena por índice — alguns providers não garantem a ordem de entrada
        data.sort(key=lambda item: item["index"])
        vectors = np.array([item["embedding"] for item in data], dtype=np.float32)

        if vectors.ndim != 2 or vectors.shape[1] != settings.embedding_dim:
            got = vectors.shape[1] if vectors.ndim == 2 else "?"
            raise RuntimeError(
                f"Dimensão retornada ({got}) difere de EMBEDDING_DIM "
                f"({settings.embedding_dim}). Ajuste EMBEDDING_DIM e recrie a "
                f"collection no Qdrant."
            )
        return vectors

    async def embed_text(self, text: str) -> np.ndarray:
        return (await self.embed_texts([text]))[0]

    async def generate_answer(self, pergunta: str, context_blocks: list[str]) -> str:
        if not context_blocks:
            return "Não encontrei receitas relevantes no acervo para sua pergunta."

        user_input = (
            f"Pergunta: {pergunta}\n\n"
            f"Receitas do acervo:\n\n"
            + "\n\n---\n\n".join(context_blocks)
        )

        response = await asyncio.to_thread(
            partial(
                self.groq.chat.completions.create,
                model=settings.llm_model,
                messages=[
                    {"role": "system", "content": SEARCH_INSTRUCTIONS},
                    {"role": "user", "content": user_input},
                ],
                max_tokens=800,
                temperature=0.2,
            )
        )
        return response.choices[0].message.content.strip()
