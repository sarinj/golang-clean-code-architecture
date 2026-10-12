"""Create the original users, user_tokens, and user_permissions tables."""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def _id_type() -> sa.BigInteger:
    return sa.BigInteger().with_variant(sa.Integer(), "sqlite")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", _id_type(), primary_key=True),
        sa.Column("email", sa.Text(), nullable=True),
        sa.Column("first_name", sa.Text(), nullable=True),
        sa.Column("last_name", sa.Text(), nullable=True),
        sa.Column("password", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_users_email", "users", ["email"], unique=True)
    for table, field_names in (
        ("user_tokens", ("access", "refresh")),
        ("user_permissions", ("permission",)),
    ):
        op.create_table(
            table,
            sa.Column("id", _id_type(), primary_key=True),
            sa.Column(
                "user_id",
                sa.BigInteger(),
                sa.ForeignKey("users.id", onupdate="CASCADE", ondelete="SET NULL"),
                nullable=True,
            ),
            *(sa.Column(name, sa.Text(), nullable=True) for name in field_names),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index(f"idx_{table}_user_id", table, ["user_id"])


def downgrade() -> None:
    op.drop_table("user_permissions")
    op.drop_table("user_tokens")
    op.drop_table("users")
