import csv
import hashlib
import io
import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import IngestResult, Receita, ReceitaChunk


def _parse_list(value: str) -> list[str]:
    if not value.strip():
        return []
    return [p.strip() for p in value.replace("|", ";").split(";") if p.strip()]


def _compute_hash(data: dict) -> str:
    blob = json.dumps(
        {k: data[k] for k in ("titulo", "categoria", "tempo_minutos", "ingredientes", "modo_preparo", "tags")},
        sort_keys=True,
        ensure_ascii=False,
    )
    return hashlib.md5(blob.encode()).hexdigest()


def _parse_row(row: dict[str, str]) -> dict:
    norm = {k.strip().lower(): (v or "").strip() for k, v in row.items() if k}

    receita_id = norm.get("id", "")
    if not receita_id:
        raise ValueError("ID ausente")

    titulo = norm.get("titulo", "")
    if not titulo:
        raise ValueError("Título ausente")

    categoria = norm.get("categoria", "")
    if categoria not in ("sobremesa", "prato_principal", "bebida", "lanche"):
        raise ValueError(f"Categoria inválida: {categoria}")

    tempo_raw = norm.get("tempo_minutos", "")
    if not tempo_raw.isdigit() or int(tempo_raw) < 1:
        raise ValueError("tempo_minutos inválido")

    ingredientes = _parse_list(norm.get("ingredientes", ""))
    if not ingredientes:
        raise ValueError("Ingredientes ausentes")

    modo_preparo = norm.get("modo_preparo", "")
    if not modo_preparo:
        raise ValueError("Modo de preparo ausente")

    return {
        "receita_id": receita_id,
        "titulo": titulo,
        "categoria": categoria,
        "tempo_minutos": int(tempo_raw),
        "ingredientes": json.dumps(ingredientes, ensure_ascii=False),
        "modo_preparo": modo_preparo,
        "tags": json.dumps(_parse_list(norm.get("tags", "")), ensure_ascii=False),
    }


async def ingest_csv(file_content: bytes, session: AsyncSession) -> IngestResult:
    text = file_content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    result = IngestResult()

    for line_num, row in enumerate(reader, start=2):
        try:
            data = _parse_row(row)
        except ValueError as exc:
            result.erros.append(f"Linha {line_num}: {exc}")
            continue

        row_hash = _compute_hash(data)
        existing = (
            await session.execute(
                select(Receita).where(Receita.receita_id == data["receita_id"])
            )
        ).scalar_one_or_none()

        if existing is None:
            session.add(Receita(**data, row_hash=row_hash))
            result.criadas += 1
        elif existing.row_hash != row_hash:
            for k, v in data.items():
                setattr(existing, k, v)
            existing.row_hash = row_hash
            old_chunks = (
                await session.execute(
                    select(ReceitaChunk).where(ReceitaChunk.receita_id == existing.id)
                )
            ).scalars().all()
            for chunk in old_chunks:
                await session.delete(chunk)
            result.atualizadas += 1
        else:
            result.ignoradas += 1

    await session.commit()
    return result
