from dataclasses import dataclass, field
from datetime import datetime

from src.domain.entities.user import UserEntity


@dataclass(frozen=True, kw_only=True)
class UserModel(UserEntity):
    password: str = field(repr=False, metadata={"public": False})

    def to_entity(self) -> UserEntity:
        return UserEntity(
            id=self.id,
            email=self.email,
            first_name=self.first_name,
            last_name=self.last_name,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )


@dataclass(frozen=True)
class UserTokenModel:
    id: int = field(metadata={"json_name": "ID"})
    user_id: int | None = field(metadata={"json_name": "UserId"})
    user: UserEntity | None = field(metadata={"schema_name": "user-model"})
    access: str
    refresh: str
    updated_at: datetime


@dataclass(frozen=True)
class UserPermissionModel:
    id: int = field(metadata={"json_name": "ID"})
    user_id: int | None = field(metadata={"json_name": "UserId"})
    user: UserEntity | None = field(metadata={"schema_name": "user-model"})
    permission: str
    updated_at: datetime
