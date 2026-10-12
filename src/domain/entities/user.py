from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal


@dataclass(frozen=True, kw_only=True)
class UserEntity:
    id: int
    email: str
    first_name: str
    last_name: str
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class UserRegisterRequest:
    email: str
    password: str = field(repr=False)
    first_name: str = ""
    last_name: str = ""


@dataclass(frozen=True)
class UserLoginRequest:
    email: str
    password: str = field(repr=False)


@dataclass(frozen=True)
class UserTokenEntity:
    access: str
    refresh: str


@dataclass(frozen=True)
class UserLoginResponse:
    user: UserEntity
    token: UserTokenEntity


@dataclass(frozen=True)
class UserTokenClaims:
    id: int
    expires_at: int
    kind: Literal["access", "refresh"]
