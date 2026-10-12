from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.domain.entities.user import UserEntity, UserRegisterRequest, UserTokenEntity
from src.domain.errors import AuthenticationError, DuplicateEmail
from src.domain.models.user import UserModel, UserPermissionModel, UserTokenModel
from src.infrastructure.database.postgres.models import (
    UserPermissionRow,
    UserRow,
    UserTokenRow,
    utc_now,
)


class PostgresUserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_user_by_email(self, email: str) -> UserModel | None:
        row = self.session.scalar(select(UserRow).where(UserRow.email == email))
        return row.to_domain() if row is not None else None

    def insert_user(self, request: UserRegisterRequest, password_hash: str) -> UserEntity:
        row = UserRow(
            email=request.email,
            password=password_hash,
            first_name=request.first_name,
            last_name=request.last_name,
        )
        self.session.add(row)
        try:
            self.session.flush()
        except IntegrityError as error:
            raise DuplicateEmail("email has already been registered") from error
        return row.to_domain().to_entity()

    def _lock_user(self, user_id: int) -> None:
        owner = self.session.scalar(
            select(UserRow.id).where(UserRow.id == user_id).with_for_update()
        )
        if owner is None:
            raise AuthenticationError("user token not found")

    def save_tokens(self, user_id: int, token: UserTokenEntity) -> None:
        self._lock_user(user_id)
        result = self.session.execute(
            update(UserTokenRow)
            .where(UserTokenRow.user_id == user_id)
            .values(access=token.access, refresh=token.refresh, updated_at=utc_now())
        )
        if result.rowcount == 0:
            self.session.add(
                UserTokenRow(user_id=user_id, access=token.access, refresh=token.refresh)
            )
        self.session.flush()

    def get_tokens(self, user_id: int, *, for_update: bool = False) -> UserTokenModel | None:
        if for_update:
            self._lock_user(user_id)
        row = self.session.scalar(
            select(UserTokenRow).where(UserTokenRow.user_id == user_id).order_by(UserTokenRow.id)
        )
        return row.to_domain() if row is not None else None

    def find_access_token(self, user_id: int, access: str) -> UserTokenModel | None:
        row = self.session.scalar(
            select(UserTokenRow).where(
                UserTokenRow.user_id == user_id, UserTokenRow.access == access
            )
        )
        return row.to_domain() if row is not None else None

    def delete_tokens(self, user_id: int) -> None:
        self.session.execute(delete(UserTokenRow).where(UserTokenRow.user_id == user_id))

    def get_permission(self, user_id: int) -> UserPermissionModel | None:
        row = self.session.scalar(
            select(UserPermissionRow)
            .where(UserPermissionRow.user_id == user_id)
            .order_by(UserPermissionRow.id)
        )
        return row.to_domain() if row is not None else None
