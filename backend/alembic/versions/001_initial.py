"""initial schema

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "receita",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("receita_id", sa.String(), nullable=False),
        sa.Column("titulo", sa.String(), nullable=False),
        sa.Column("categoria", sa.String(), nullable=False),
        sa.Column("tempo_minutos", sa.Integer(), nullable=False),
        sa.Column("ingredientes", sa.Text(), nullable=False),
        sa.Column("modo_preparo", sa.Text(), nullable=False),
        sa.Column("tags", sa.Text(), nullable=False),
        sa.Column("row_hash", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_receita_receita_id", "receita", ["receita_id"], unique=True)
    op.create_index("ix_receita_row_hash", "receita", ["row_hash"])

    op.create_table(
        "receita_chunk",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("receita_id", sa.Integer(), nullable=False),
        sa.Column("chunk_type", sa.String(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("qdrant_point_id", sa.String(), nullable=True),
        sa.Column("embedded_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["receita_id"], ["receita.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_receita_chunk_receita_id", "receita_chunk", ["receita_id"])
    op.create_index("ix_receita_chunk_qdrant_point_id", "receita_chunk", ["qdrant_point_id"])


def downgrade() -> None:
    op.drop_table("receita_chunk")
    op.drop_table("receita")
