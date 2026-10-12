from datetime import UTC, datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, Integer, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from src.domain.models.user import UserModel, UserPermissionModel, UserTokenModel


def utc_now() -> datetime:
    return datetime.now(UTC)


def _timestamp(value: datetime | None) -> datetime:
    value = value or datetime.min.replace(tzinfo=UTC)
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


class Base(DeclarativeBase):
    pass


class UserRow(Base):
    __tablename__ = "users"
    __table_args__ = (Index("idx_users_email", "email", unique=True),)

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True)
    email: Mapped[str] = mapped_column(Text, nullable=True)
    first_name: Mapped[str] = mapped_column(Text, nullable=True)
    last_name: Mapped[str] = mapped_column(Text, nullable=True)
    password: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    def to_domain(self) -> UserModel:
        return UserModel(
            id=self.id,
            email=self.email or "",
            first_name=self.first_name or "",
            last_name=self.last_name or "",
            password=self.password or "",
            created_at=_timestamp(self.created_at),
            updated_at=_timestamp(self.updated_at),
        )


class UserTokenRow(Base):
    __tablename__ = "user_tokens"
    __table_args__ = (Index("idx_user_tokens_user_id", "user_id"),)

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", onupdate="CASCADE", ondelete="SET NULL")
    )
    access: Mapped[str] = mapped_column(Text, nullable=True)
    refresh: Mapped[str] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
    user: Mapped[UserRow | None] = relationship(lazy="joined")

    def to_domain(self) -> UserTokenModel:
        return UserTokenModel(
            id=self.id,
            user_id=self.user_id,
            user=self.user.to_domain().to_entity() if self.user is not None else None,
            access=self.access or "",
            refresh=self.refresh or "",
            updated_at=_timestamp(self.updated_at),
        )


class UserPermissionRow(Base):
    __tablename__ = "user_permissions"
    __table_args__ = (Index("idx_user_permissions_user_id", "user_id"),)

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", onupdate="CASCADE", ondelete="SET NULL")
    )
    permission: Mapped[str] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
    user: Mapped[UserRow | None] = relationship(lazy="joined")

    def to_domain(self) -> UserPermissionModel:
        return UserPermissionModel(
            id=self.id,
            user_id=self.user_id,
            user=self.user.to_domain().to_entity() if self.user is not None else None,
            permission=self.permission or "",
            updated_at=_timestamp(self.updated_at),
        )


POSTGRES_MODELS = {
    UserModel: UserRow,
    UserTokenModel: UserTokenRow,
    UserPermissionModel: UserPermissionRow,
}
