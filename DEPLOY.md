# Deploy — Front (Vercel) + Back (Render)

Guia para colocar o **Buscador Inteligente de Receitas** no ar.

## Arquitetura em produção

O sistema não é um back só: precisa de **3 peças** no servidor + 2 APIs externas.

```
[Vercel]                [Render]                    [Qdrant Cloud]
 Next.js   ──HTTPS──▶  FastAPI (Docker)  ──────▶   índice vetorial
                          │
                          ├──▶ Postgres (Render gerenciado)
                          ├──▶ Groq API  (LLM, externo)
                          └──▶ Jina API  (embeddings, externo)
```

O Render **não** oferece Qdrant gerenciado, por isso ele fica no **Qdrant Cloud**
(free tier sobra para este projeto).

> ✅ **Embeddings via API:** este backend gera embeddings chamando uma API
> (Jina, por padrão) em vez de rodar `sentence-transformers`/`torch` local.
> Resultado: a imagem é pequena e o serviço **cabe no plano Free (512 MB)**.

---

## 0. Pré-requisitos (contas + chaves)

| Item | Onde | Custo |
|------|------|-------|
| Conta Render | render.com | grátis p/ começar |
| Conta Vercel | vercel.com | grátis |
| Cluster Qdrant Cloud | cloud.qdrant.io | free tier (1 GB) |
| Chave Groq (LLM) | console.groq.com/keys | grátis |
| Chave Jina (embeddings) | jina.ai → "API" | free (10M tokens) |

> ℹ️ A chave Jina free dá ~10 milhões de tokens — muito mais do que estas
> ~30 receitas precisam. Não pede cartão.

---

## 1. Qdrant Cloud (índice vetorial)

1. Crie um cluster grátis em https://cloud.qdrant.io
2. Anote:
   - **Endpoint** — algo como `xyz-abc.eu-central.aws.cloud.qdrant.io`
     (use só o host, **sem** `https://` e **sem** porta)
   - **API key**

> A collection é criada automaticamente pelo backend com **1024 dimensões**
> (default do `jina-embeddings-v3`). Se você trocar o modelo de embedding,
> ajuste `EMBEDDING_DIM` — e, se a collection já existir com outra dimensão,
> apague-a no Qdrant (o backend recusa subir com dimensão divergente).

---

## 2. Backend no Render

### Opção A — Blueprint (recomendado, 1 clique)

O repo tem um `render.yaml` na raiz que cria o serviço **e** o Postgres.

1. Render → **New** → **Blueprint** → conecte o GitHub e selecione o repo.
2. O Render lê o `render.yaml`: 1 web service (free) + 1 database (free).
3. Preencha as variáveis marcadas como "sync: false":
   - `GROQ_API_KEY` = chave Groq
   - `EMBEDDING_API_KEY` = chave Jina
   - `QDRANT_HOST` = endpoint do Qdrant (host puro)
   - `QDRANT_API_KEY` = api key do Qdrant
   - `CORS_ORIGINS` = deixe em branco por ora (passo 4)
4. **Apply**. O `DATABASE_URL` é injetado automaticamente.

### Opção B — Manual

1. Render → **New** → **Web Service** → conecte o repo.
2. Configurações:
   - **Root Directory:** `backend`
   - **Runtime:** Docker (detecta o `backend/Dockerfile`)
   - **Health Check Path:** `/api/health`
   - **Instance Type:** Free já basta
3. Crie um Postgres: **New → Postgres** (mesma região).
4. Em **Environment** do web service, adicione:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | Internal Database URL do Postgres (`postgresql://...`) |
| `GROQ_API_KEY` | chave Groq |
| `LLM_MODEL` | `llama-3.3-70b-versatile` |
| `EMBEDDING_API_BASE` | `https://api.jina.ai/v1` |
| `EMBEDDING_API_KEY` | chave Jina |
| `EMBEDDING_MODEL` | `jina-embeddings-v3` |
| `EMBEDDING_DIM` | `1024` |
| `QDRANT_HOST` | endpoint Qdrant (host puro) |
| `QDRANT_PORT` | `6333` |
| `QDRANT_API_KEY` | api key Qdrant |
| `QDRANT_HTTPS` | `true` |
| `QDRANT_COLLECTION` | `receitas` |
| `CORS_ORIGINS` | (em branco por ora) |

> Não se preocupe com o esquema da URL do Postgres: o `config.py` converte
> `postgresql://` → `postgresql+asyncpg://` e remove `sslmode` sozinho.
> Use a **Internal Database URL** (mesma região = sem SSL, mais rápido).

5. Deploy. Anote a URL pública, ex.: `https://receitas-backend.onrender.com`
6. Teste: `https://SEU-BACK.onrender.com/api/health` → `{"status":"ok"}`.
   Swagger em `/docs`.

---

## 3. Frontend no Vercel

1. Vercel → **Add New** → **Project** → importe o repo.
2. Configurações:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js (detecta sozinho)
3. **Environment Variables:**

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://SEU-BACK.onrender.com` (sem barra no fim) |

4. **Deploy**. Anote a URL final, ex.: `https://receitas.vercel.app`.

---

## 4. Conectar os dois (CORS) — não pule

O backend só aceita requisições das origens em `CORS_ORIGINS`.

1. Render → web service → **Environment**.
2. `CORS_ORIGINS` = `https://receitas.vercel.app`
   (várias origens? separe por vírgula)
3. Salve → redeploy automático. Sem isso, o front carrega mas as buscas
   falham com erro de CORS no console.

---

## 5. Popular os dados

Com o backend no ar, rode o pipeline (3 chamadas idempotentes):

```bash
BACK=https://SEU-BACK.onrender.com

curl -X POST $BACK/pipelines/ingest-csv \
  -F "file=@backend/data/receitas-exemplo.csv"
curl -X POST $BACK/pipelines/chunk
curl -X POST $BACK/pipelines/index
```

Ou pela tela de **upload** no front.

Pronto — acesse `https://receitas.vercel.app/buscar`.

---

## Trocar o provider de embeddings (opcional)

O backend fala com qualquer endpoint **OpenAI-compatible** de embeddings.
Para trocar, mude 3 variáveis (e recrie a collection se a dimensão mudar):

| Provider | `EMBEDDING_API_BASE` | `EMBEDDING_MODEL` | `EMBEDDING_DIM` |
|----------|----------------------|-------------------|-----------------|
| Jina (default) | `https://api.jina.ai/v1` | `jina-embeddings-v3` | `1024` |
| OpenAI | `https://api.openai.com/v1` | `text-embedding-3-small` | `1536` |
| Nebius | `https://api.studio.nebius.com/v1` | `BAAI/bge-multilingual-gemma2` | `3584` |

Nenhuma mudança de código — só env vars.

---

## Checklist rápido

- [ ] Cluster Qdrant criado (host + api key)
- [ ] Chave Groq gerada
- [ ] Chave Jina gerada
- [ ] Backend no Render no ar, `/api/health` = ok (Free basta)
- [ ] Front na Vercel com `NEXT_PUBLIC_API_URL` apontando pro back
- [ ] `CORS_ORIGINS` no back = URL da Vercel
- [ ] Pipeline populado (ingest → chunk → index)
- [ ] Lembrete: Postgres free expira em 30 dias

---

## Erros comuns

| Sintoma | Causa | Correção |
|---------|-------|----------|
| `EMBEDDING_API_KEY não configurada` | faltou a chave Jina | setar `EMBEDDING_API_KEY` |
| Erro "Dimensão retornada X difere de EMBEDDING_DIM" | modelo ≠ dim configurada | alinhe `EMBEDDING_DIM` ao modelo |
| "collection existe com dimensão N" | collection antiga (ex. 384) | apague a collection no Qdrant e reindexe |
| Buscas falham, erro CORS no console | `CORS_ORIGINS` errado | inclua a URL exata da Vercel |
| `InvalidPasswordError`/SSL no asyncpg | usou External URL com sslmode | use a Internal Database URL |
| Primeira requisição demora ~50s | free web service "spin down" | normal no free; some no pago |
| Qdrant "connection refused" | faltou `QDRANT_HTTPS=true` | cloud exige https |
