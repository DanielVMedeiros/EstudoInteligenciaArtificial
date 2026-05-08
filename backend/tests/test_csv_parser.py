import pytest

from app.services.ingestion import _parse_row


def test_parse_row_valid():
    row = {
        "id": "rec-001",
        "titulo": "Bolo de Cenoura",
        "categoria": "sobremesa",
        "tempo_minutos": "45",
        "ingredientes": "cenoura;farinha;açúcar",
        "modo_preparo": "Misture e asse por 35 minutos.",
        "tags": "vegano",
    }
    data = _parse_row(row)
    assert data["receita_id"] == "rec-001"
    assert data["titulo"] == "Bolo de Cenoura"
    assert data["categoria"] == "sobremesa"
    assert data["tempo_minutos"] == 45


def test_parse_row_missing_id():
    row = {
        "id": "",
        "titulo": "Teste",
        "categoria": "bebida",
        "tempo_minutos": "5",
        "ingredientes": "água",
        "modo_preparo": "Sirva.",
        "tags": "",
    }
    with pytest.raises(ValueError, match="ID ausente"):
        _parse_row(row)


def test_parse_row_invalid_categoria():
    row = {
        "id": "r1",
        "titulo": "T",
        "categoria": "pizza",
        "tempo_minutos": "10",
        "ingredientes": "x",
        "modo_preparo": "y",
        "tags": "",
    }
    with pytest.raises(ValueError, match="Categoria inválida"):
        _parse_row(row)


def test_parse_row_categoria_lanche():
    row = {
        "id": "r2",
        "titulo": "Sanduíche Natural",
        "categoria": "lanche",
        "tempo_minutos": "10",
        "ingredientes": "pão;queijo;tomate",
        "modo_preparo": "Monte e sirva.",
        "tags": "",
    }
    data = _parse_row(row)
    assert data["categoria"] == "lanche"


def test_parse_row_pipe_separator():
    row = {
        "id": "r3",
        "titulo": "Mix",
        "categoria": "prato_principal",
        "tempo_minutos": "20",
        "ingredientes": "frango|arroz|feijão",
        "modo_preparo": "Cozinhe tudo.",
        "tags": "sem_gluten|vegano",
    }
    data = _parse_row(row)
    import json
    assert json.loads(data["ingredientes"]) == ["frango", "arroz", "feijão"]
