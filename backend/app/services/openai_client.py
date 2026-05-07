import asyncio
from functools import partial

import numpy as np
from groq import Groq
from sentence_transformers import SentenceTransformer

from app.config import settings
from app.prompts.search import SEARCH_INSTRUCTIONS


class OpenAIService:
    """Mantém o nome para não alterar imports. Internamente usa Groq + sentence-transformers."""

    def __init__(self) -> None:
        self._groq: Groq | None = None
        self._embedder: SentenceTransformer | None = None

    @property
    def groq(self) -> Groq:
        if self._groq is None:
            if not settings.groq_api_key:
                raise RuntimeError("GROQ_API_KEY não configurada")
            self._groq = Groq(api_key=settings.groq_api_key)
        return self._groq

    @property
    def embedder(self) -> SentenceTransformer:
        if self._embedder is None:
            self._embedder = SentenceTransformer(settings.embedding_model)
        return self._embedder

    async def embed_texts(self, texts: list[str]) -> np.ndarray:
        def _encode() -> np.ndarray:
            return self.embedder.encode(texts, normalize_embeddings=True, show_progress_bar=False)

        vectors = await asyncio.to_thread(_encode)
        return np.array(vectors, dtype=np.float32)

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
