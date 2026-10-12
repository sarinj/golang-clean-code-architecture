from typing import Literal, Protocol

from src.domain.entities.user import UserTokenClaims, UserTokenEntity


class PasswordHasher(Protocol):
    def hash(self, password: str) -> str: ...

    def verify(self, password: str, password_hash: str) -> bool: ...


class TokenService(Protocol):
    def issue_tokens(
        self, user_id: int, *, refresh_expires_at: int | None = None
    ) -> UserTokenEntity: ...

    def parse(self, token: str, kind: Literal["access", "refresh"]) -> UserTokenClaims: ...
