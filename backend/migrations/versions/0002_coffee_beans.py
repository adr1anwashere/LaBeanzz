"""add coffee_beans table

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-13
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ROAST_LEVELS = ("LIGHT", "MEDIUM_LIGHT", "MEDIUM", "MEDIUM_DARK", "DARK")
BEAN_STATUSES = ("AVAILABLE", "LOW_STOCK", "RESERVED", "OUT_OF_STOCK")


def upgrade() -> None:
    op.create_table(
        "coffee_beans",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "supplier_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("suppliers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("origin", sa.String(100), nullable=False),
        sa.Column("region", sa.String(100)),
        sa.Column("farm", sa.String(200)),
        sa.Column("producer", sa.String(200)),
        sa.Column("varietal", sa.String(100)),
        sa.Column("altitude_m", sa.Integer),
        sa.Column("processing_method", sa.String(100)),
        sa.Column("roast_level", sa.String(20), nullable=False),
        sa.Column(
            "flavor_notes",
            postgresql.ARRAY(sa.Text),
            nullable=False,
            server_default="{}",
        ),
        sa.Column("acidity", sa.Numeric(3, 1), nullable=False),
        sa.Column("body", sa.Numeric(3, 1), nullable=False),
        sa.Column("sweetness", sa.Numeric(3, 1), nullable=False),
        sa.Column("price_per_kg", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "stock_kg",
            sa.Numeric(10, 2),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="AVAILABLE",
        ),
        sa.Column("producer_story", sa.Text),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        # Constraints
        sa.CheckConstraint("acidity  >= 0 AND acidity  <= 10", name="ck_bean_acidity"),
        sa.CheckConstraint("body     >= 0 AND body     <= 10", name="ck_bean_body"),
        sa.CheckConstraint("sweetness >= 0 AND sweetness <= 10", name="ck_bean_sweetness"),
        sa.CheckConstraint("stock_kg >= 0", name="ck_bean_stock_kg"),
        sa.CheckConstraint(
            f"roast_level IN {ROAST_LEVELS}", name="ck_bean_roast_level"
        ),
        sa.CheckConstraint(
            f"status IN {BEAN_STATUSES}", name="ck_bean_status"
        ),
    )

    op.create_index("ix_coffee_beans_supplier_id", "coffee_beans", ["supplier_id"])
    op.create_index(
        "ix_coffee_beans_status_supplier",
        "coffee_beans",
        ["status", "supplier_id"],
    )


def downgrade() -> None:
    op.drop_table("coffee_beans")
