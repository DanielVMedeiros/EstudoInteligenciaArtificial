# Buscador Inteligente de Receitas

Mini sistema RAG para busca semântica em receitas culinárias. O usuário digita uma pergunta em linguagem natural e recebe uma resposta gerada por LLM com citações numeradas rastreáveis.

## Stack

| Camada | Tecnologia |
|--------|------------|
| API | Python 3.12, FastAPI, SQLModel, Alembic |
| Banco relacional | Postgres 16 |
| Índice vetorial | Qdrant (payload indexes + filtros server-side) |
| Embeddings | API OpenAI-compatible (Jina `jina-embeddings-v3`) |
| LLM | Groq `llama-3.3-70b-versatile` |
| Frontend | Next.js 15 (App Router), React 19, TanStack Query, Tailwind 4, Radix UI |
| Infra | Docker Compose |

## Pré-requisitos

- Docker e Docker Compose
- Chave da Groq (`GROQ_API_KEY`) — LLM
- Chave da Jina (`EMBEDDING_API_KEY`) — embeddings

## Como rodar

```bash
cd projeto-IA
cp .env.example .env
# Edite .env e adicione GROQ_API_KEY (LLM) e EMBEDDING_API_KEY (Jina)

docker compose up --build
```

Serviços sobem na ordem: **Postgres → Qdrant → Backend → Frontend**.
- Frontend: http://localhost:3000/buscar
- Swagger: http://localhost:5000/docs

## Popular dados em 1 comando

Aguarde os 4 containers estarem `healthy`, então:

```bash
bash populate.sh
```

Ou manualmente:

```bash
curl -X POST http://localhost:5000/pipelines/ingest-csv \
  -F "file=@backend/data/receitas-exemplo.csv"

curl -X POST http://localhost:5000/pipelines/chunk

curl -X POST http://localhost:5000/pipelines/index
```

## Como rodar os testes

Requer Postgres rodando (pode ser via Docker Compose):

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate   # Windows
# ou: source .venv/bin/activate                   # Linux/Mac
pip install -r requirements.txt
pytest tests/ -v
```

Para apontar para outro banco de teste:

```bash
TEST_DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db pytest tests/ -v
```

## Pipelines

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/pipelines/ingest-csv` | Upsert idempotente de receitas via CSV (row_hash) |
| POST | `/pipelines/chunk` | Cria 3 chunks por receita ainda não chunkeada (retomável) |
| POST | `/pipelines/index` | Embeds + upsert no Qdrant para chunks sem `qdrant_point_id` (retomável) |
| POST | `/query` | Busca semântica com filtros server-side no Qdrant |
| GET | `/api/health` | Health check |

## Formato do CSV

```
id,titulo,categoria,tempo_minutos,ingredientes,modo_preparo,tags
```

- `categoria`: `sobremesa` | `prato_principal` | `bebida` | `lanche`
- `ingredientes` e `tags`: separados por `;`
- `tempo_minutos`: inteiro positivo

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `GROQ_API_KEY` | Chave da API Groq (LLM) | — |
| `LLM_MODEL` | Modelo de geração | `llama-3.3-70b-versatile` |
| `EMBEDDING_API_BASE` | Base do endpoint de embeddings | `https://api.jina.ai/v1` |
| `EMBEDDING_API_KEY` | Chave da API de embeddings | — |
| `EMBEDDING_MODEL` | Modelo de embeddings | `jina-embeddings-v3` |
| `EMBEDDING_DIM` | Dimensão do vetor | `1024` |
| `DATABASE_URL` | Postgres (aceita `postgresql://`, normaliza p/ asyncpg) | `...@postgres:5432/recipe` |
| `QDRANT_HOST` | Host do Qdrant | `qdrant` |
| `QDRANT_PORT` | Porta do Qdrant | `6333` |
| `QDRANT_API_KEY` | API key do Qdrant (Qdrant Cloud) | — |
| `QDRANT_HTTPS` | Usar HTTPS no Qdrant (cloud = `true`) | `false` |
| `CORS_ORIGINS` | Origens liberadas (separadas por vírgula) | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | URL da API para o frontend | `http://localhost:5000` |

> Deploy em produção (Vercel + Render): veja **[DEPLOY.md](DEPLOY.md)**.

---

## Decisões de design

### Como o chunker se comporta com modo_preparo curto ou longo?

Cada receita gera exatamente 3 chunks fixos: `titulo_resumo` (metadados concatenados), `ingredientes` (lista) e `modo_preparo` (texto integral). **Não há divisão por parágrafo ou tamanho.** Um modo_preparo de 1 frase vira 1 chunk curto — o embedding funciona bem para textos curtos. Um modo_preparo de 30 parágrafos vira 1 chunk longo — o embedding ainda captura a semântica geral, mas perde granularidade. Para conjuntos maiores (>10k receitas), adicionaria split por janelas deslizantes com overlap de ~100 tokens usando `RecursiveCharacterTextSplitter`, gerando múltiplos chunks de `modo_preparo` com `receita_id` compartilhado.

### Por que payload indexes no Qdrant em vez de WHERE no Postgres?

Os filtros no Qdrant são aplicados **durante** a busca ANN (Approximate Nearest Neighbor), antes do ranking por similaridade. O Qdrant elimina os candidatos que não satisfazem os filtros antes de calcular cosine similarity — nenhum vetor desnecessário é computado. Com WHERE no Postgres, o fluxo seria: buscar todos os embeddings → calcular similaridade contra todos → filtrar o resultado — O(n) em embeddings. Com payload indexes, o Qdrant usa índices invertidos para reduzir o espaço de busca em O(k) onde k << n. Para filtros seletivos (ex.: `categoria=bebida` remove 75% dos pontos), a diferença de latência é de 1 a 2 ordens de magnitude em datasets grandes.

### 3 mudanças concretas para crescer de 30 para 100.000 receitas

1. **Chunking com sliding window**: Dividir `ingredientes` e `modo_preparo` em janelas de ~512 tokens com 20% de overlap. Número de chunks sobe de 3 para ~5-8 por receita, melhorando recall em textos longos.
2. **Qdrant HNSW + quantização escalar**: Habilitar `ScalarQuantization` na collection para reduzir uso de memória em ~4×, mantendo 95%+ de recall. Configurar `m` e `ef_construct` no HNSW para o trade-off latência/qualidade desejado.
3. **Indexação assíncrona com fila (ARQ ou Celery)**: Mover os pipelines de chunking e indexação para workers em background com Redis como broker. O endpoint `POST /pipelines/index` retorna um job_id imediatamente e o processamento ocorre em paralelo, com status real via `GET /pipelines/{job_id}/status`.

### Parte do código com que não estou satisfeito

A persistência de `ingredientes` e `tags` como JSON serializado em colunas `Text` do Postgres (`["farinha", "açúcar"]` como string). Funciona, mas impede queries nativas eficientes (`WHERE 'vegano' = ANY(tags)`), exige deserialização manual em Python, e não aproveita o tipo `ARRAY` ou `JSONB` do Postgres com índices GIN. Escolhi assim para compatibilidade simples com SQLModel/Alembic sem tipos customizados, mas para produção usaria `ARRAY(String)` ou `JSONB` com índice GIN para filtros nativos no banco.
