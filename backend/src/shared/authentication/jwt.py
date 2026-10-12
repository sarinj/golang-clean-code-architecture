import time
from typing import Literal
from uuid import uuid4

import jwt

from src.domain.entities.user import UserTokenClaims, UserTokenEntity
from src.domain.errors import AuthenticationError


class JWTTokenService:
    def __init__(
        self, secret_key: str, issuer: str, access_expires: int, refresh_expires: int
    ) -> None:
        self.secret_key = secret_key
        self.issuer = issuer.lower()
        self.access_expires = access_expires
        self.refresh_expires = refresh_expires

    def issue_tokens(
        self, user_id: int, *, refresh_expires_at: int | None = None
    ) -> UserTokenEntity:
        now = int(time.time())
        refresh_deadline = (
            refresh_expires_at if refresh_expires_at is not None else now + self.refresh_expires
        )
        return UserTokenEntity(
            access=self._sign(user_id, "access", now, now + self.access_expires),
            refresh=self._sign(user_id, "refresh", now, refresh_deadline),
        )

    def _sign(self, user_id: int, kind: str, now: int, expires_at: int) -> str:
        return jwt.encode(
            {
                "claims": {"id": user_id},
                "iss": self.issuer,
                "sub": f"{kind}-token",
                "aud": ["user", "admin"],
                "exp": expires_at,
                "nbf": now,
                "iat": now,
                "jti": str(uuid4()),
            },
            self.secret_key,
            algorithm="HS256",
        )

    def parse(self, token: str, kind: Literal["access", "refresh"]) -> UserTokenClaims:
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=["HS256"],
                issuer=self.issuer,
                audience=["user", "admin"],
                subject=f"{kind}-token",
                options={"require": ["claims", "exp", "iss", "sub", "aud"]},
            )
        except jwt.ExpiredSignatureError as error:
            raise AuthenticationError("token had expired") from error
        except (jwt.InvalidTokenError, TypeError, ValueError) as error:
            raise AuthenticationError("token format or claims are invalid") from error

        claims = payload.get("claims")
        user_id = claims.get("id") if isinstance(claims, dict) else None
        expires_at = payload.get("exp")
        if (
            type(user_id) is not int
            or not 0 < user_id <= 9223372036854775807
            or type(expires_at) is not int
        ):
            raise AuthenticationError("claims type is invalid")
        return UserTokenClaims(id=user_id, expires_at=expires_at, kind=kind)
