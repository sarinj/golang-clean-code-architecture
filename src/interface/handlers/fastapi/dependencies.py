from collections.abc import Iterator
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from src.domain.entities.user import UserEntity
from src.domain.errors import AuthenticationError
from src.domain.models.user import UserPermissionModel
from src.interface.handlers.fastapi.errors import APIError
from src.interface.repositories.crud import RepositoryFactory
from src.interface.repositories.postgres.user import PostgresUserRepository
from src.usecases.crud import CRUDUsecase
from src.usecases.user import UserUsecase


@dataclass(frozen=True)
class Application:
    user: UserUsecase
    crud: CRUDUsecase


@dataclass(frozen=True)
class AuthenticationContext:
    user: UserEntity
    permission: UserPermissionModel | None


def get_session(request: Request) -> Iterator[Session]:
    with request.app.state.postgres.session() as session:
        yield session


def get_application(
    request: Request,
    session: Annotated[Session, Depends(get_session, scope="function")],
) -> Application:
    return Application(
        user=UserUsecase(
            PostgresUserRepository(session), request.app.state.passwords, request.app.state.tokens
        ),
        crud=CRUDUsecase(
            RepositoryFactory(session, request.app.state.mongo, request.app.state.models)
        ),
    )


ApplicationDependency = Annotated[Application, Depends(get_application)]
bearer = HTTPBearer(auto_error=False)


def authenticated_user(
    application: ApplicationDependency,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> AuthenticationContext:
    if credentials is None:
        raise APIError(401, "middlware-002", "a Bearer access token is required")
    try:
        user, permission = application.user.authenticate(credentials.credentials)
    except AuthenticationError as error:
        raise APIError(401, "middlware-002", str(error)) from error
    return AuthenticationContext(user=user, permission=permission)


AuthenticationDependency = Annotated[AuthenticationContext, Depends(authenticated_user)]
