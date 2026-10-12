from fastapi import APIRouter

from src.domain.entities.user import (
    UserEntity,
    UserLoginRequest,
    UserLoginResponse,
    UserRegisterRequest,
)
from src.interface.handlers.fastapi.dependencies import (
    ApplicationDependency,
    AuthenticationDependency,
)
from src.interface.handlers.fastapi.schemas import (
    ErrorResponse,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RegisterRequest,
    UserResponse,
)

router = APIRouter(prefix="/users", tags=["User"], responses={400: {"model": ErrorResponse}})


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
    responses={409: {"model": ErrorResponse}},
)
def register(request: RegisterRequest, application: ApplicationDependency) -> UserEntity:
    return application.user.register(
        UserRegisterRequest(
            email=str(request.email),
            password=request.password,
            first_name=request.first_name,
            last_name=request.last_name,
        )
    )


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, application: ApplicationDependency) -> UserLoginResponse:
    return application.user.login(
        UserLoginRequest(email=str(request.email), password=request.password)
    )


@router.post("/refresh-token", response_model=LoginResponse)
def refresh(request: RefreshTokenRequest, application: ApplicationDependency) -> UserLoginResponse:
    return application.user.refresh(request.refresh_token)


@router.post("/logout")
def logout(request: RefreshTokenRequest, application: ApplicationDependency) -> None:
    application.user.logout(request.refresh_token)


@router.post("/profile", response_model=UserResponse, responses={401: {"model": ErrorResponse}})
def profile(authentication: AuthenticationDependency) -> UserEntity:
    return authentication.user
