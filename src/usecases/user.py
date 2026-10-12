import hmac

from src.domain.entities.user import (
    UserEntity,
    UserLoginRequest,
    UserLoginResponse,
    UserRegisterRequest,
)
from src.domain.errors import AuthenticationError, DuplicateEmail
from src.domain.models.user import UserPermissionModel
from src.domain.repositories.user import UserRepository
from src.domain.services.authentication import PasswordHasher, TokenService


class UserUsecase:
    def __init__(
        self, repository: UserRepository, passwords: PasswordHasher, tokens: TokenService
    ) -> None:
        self.repository = repository
        self.passwords = passwords
        self.tokens = tokens

    def register(self, request: UserRegisterRequest) -> UserEntity:
        if self.repository.get_user_by_email(request.email) is not None:
            raise DuplicateEmail("email has already been registered")
        return self.repository.insert_user(request, self.passwords.hash(request.password))

    def login(self, request: UserLoginRequest) -> UserLoginResponse:
        user = self.repository.get_user_by_email(request.email)
        if user is None or not self.passwords.verify(request.password, user.password):
            raise AuthenticationError("email or password is invalid")
        token = self.tokens.issue_tokens(user.id)
        self.repository.save_tokens(user.id, token)
        return UserLoginResponse(user=user.to_entity(), token=token)

    def refresh(self, refresh_token: str) -> UserLoginResponse:
        claims = self.tokens.parse(refresh_token, "refresh")
        user = self._get_refresh_user(claims.id, refresh_token)
        token = self.tokens.issue_tokens(claims.id, refresh_expires_at=claims.expires_at)
        self.repository.save_tokens(claims.id, token)
        return UserLoginResponse(user=user, token=token)

    def logout(self, refresh_token: str) -> None:
        claims = self.tokens.parse(refresh_token, "refresh")
        self._get_refresh_user(claims.id, refresh_token)
        self.repository.delete_tokens(claims.id)

    def authenticate(self, access_token: str) -> tuple[UserEntity, UserPermissionModel | None]:
        claims = self.tokens.parse(access_token, "access")
        stored = self.repository.find_access_token(claims.id, access_token)
        if stored is None or stored.user is None:
            raise AuthenticationError("user token not found")
        return stored.user, self.repository.get_permission(claims.id)

    def _get_refresh_user(self, user_id: int, token: str) -> UserEntity:
        stored = self.repository.get_tokens(user_id, for_update=True)
        if stored is None or stored.user is None or not hmac.compare_digest(stored.refresh, token):
            raise AuthenticationError("user token not found")
        return stored.user
