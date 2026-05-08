import json

import pytest

from app.models import Receita
from app.services.chunker import _build_chunks


def _make_receita(**kwargs) -> Receita:
    defaults = {
        "id": 1,
        "receita_id": "r1",
        "titulo": "Bolo de Cenoura",
        "categoria": "sobremesa",
        "tempo_minutos": 30,
        "ingredientes": json.dumps(["farinha", "açúcar", "cenoura"]),
        "modo_preparo": "Misture os ingredientes e asse por 35 minutos.",
        "tags": json.dumps(["vegano"]),
        "row_hash": "abc123",
    }
    defaults.update(kwargs)
    return Receita(**defaults)


def test_build_chunks_returns_three():
    chunks = _build_chunks(_make_receita())
    assert len(chunks) == 3


def test_chunk_types_in_order():
    chunks = _build_chunks(_make_receita())
    types = [ct for ct, _ in chunks]
    assert types == ["titulo_resumo", "ingredientes", "modo_preparo"]


def test_titulo_resumo_contains_metadata():
    receita = _make_receita(titulo="Pudim", categoria="sobremesa", tempo_minutos=60)
    chunks = dict(_build_chunks(receita))
    assert "Pudim" in chunks["titulo_resumo"]
    assert "sobremesa" in chunks["titulo_resumo"]
    assert "60" in chunks["titulo_resumo"]


def test_short_modo_preparo_preserved():
    receita = _make_receita(modo_preparo="Sirva gelado.")
    chunks = dict(_build_chunks(receita))
    assert chunks["modo_preparo"] == "Sirva gelado."


def test_long_modo_preparo_not_truncated():
    long_text = "Passo X. " * 100
    receita = _make_receita(modo_preparo=long_text)
    chunks = dict(_build_chunks(receita))
    assert chunks["modo_preparo"] == long_text


def test_empty_tags_handled():
    receita = _make_receita(tags=json.dumps([]))
    chunks = dict(_build_chunks(receita))
    assert "nenhuma" in chunks["titulo_resumo"]
