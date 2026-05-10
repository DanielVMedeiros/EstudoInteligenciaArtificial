#!/bin/bash
set -e

BASE="${API_URL:-http://localhost:5000}"
CSV="${CSV_FILE:-backend/data/receitas-exemplo.csv}"

echo "1/3 Ingestao do CSV..."
curl -sf -X POST "$BASE/pipelines/ingest-csv" -F "file=@$CSV"
echo ""

echo "2/3 Criando chunks..."
curl -sf -X POST "$BASE/pipelines/chunk"
echo ""

echo "3/3 Indexando no Qdrant..."
curl -sf -X POST "$BASE/pipelines/index"
echo ""

echo "Pronto! Acesse http://localhost:3000/buscar"
