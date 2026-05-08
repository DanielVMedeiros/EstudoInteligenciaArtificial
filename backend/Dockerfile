FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 1000 app \
    && useradd --uid 1000 --gid app --create-home app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini .
COPY alembic ./alembic
COPY app ./app

# CONFIG.py → config.py so "from app.config import settings" works on Linux (case-sensitive)
RUN cp app/CONFIG.py app/config.py

# Pré-baixa modelo em /opt/models — fora do volume hf-cache — para que o
# volume não shadow o modelo pré-compilado na imagem.
ENV HF_HOME=/opt/models
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')"

RUN mkdir -p /app/.cache/huggingface && chown -R app:app /app /opt/models

USER app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

CMD sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 5000"
