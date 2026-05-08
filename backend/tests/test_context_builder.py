from app.models import QueryFilters
from app.services.query import _build_filter


def test_no_filters_returns_none():
    assert _build_filter(None) is None


def test_empty_filters_returns_none():
    assert _build_filter(QueryFilters()) is None


def test_categoria_filter_creates_must_condition():
    result = _build_filter(QueryFilters(categoria="sobremesa"))
    assert result is not None
    keys = [c.key for c in result.must]
    assert "categoria" in keys


def test_tempo_max_filter_creates_must_condition():
    result = _build_filter(QueryFilters(tempo_max=30))
    assert result is not None
    keys = [c.key for c in result.must]
    assert "tempo_minutos" in keys


def test_tags_filter_creates_must_condition():
    result = _build_filter(QueryFilters(tags_qualquer=["vegano", "sem_lactose"]))
    assert result is not None
    keys = [c.key for c in result.must]
    assert "tags" in keys


def test_combined_three_filters():
    result = _build_filter(
        QueryFilters(categoria="bebida", tempo_max=10, tags_qualquer=["vegano"])
    )
    assert result is not None
    assert len(result.must) == 3


def test_none_tags_qualquer_ignored():
    result = _build_filter(QueryFilters(categoria="lanche", tags_qualquer=None))
    assert result is not None
    assert len(result.must) == 1
