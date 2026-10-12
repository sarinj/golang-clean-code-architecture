import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from src.domain.errors import DomainError, DuplicateEmail

logger = logging.getLogger(__name__)


class APIError(Exception):
    def __init__(self, status_code: int, trace_id: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.trace_id = trace_id


def trace_id(request: Request) -> str:
    return {
        "register": "users-001",
        "login": "users-002",
        "refresh-token": "users-003",
        "logout": "users-004",
        "profile": "middlware-002",
    }.get(request.url.path.rstrip("/").rsplit("/", 1)[-1], "error")


def _response(status: int, trace: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"trace_id": trace, "message": message})


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(APIError)
    async def api_error(request: Request, error: APIError) -> JSONResponse:
        return _response(error.status_code, error.trace_id, str(error))

    @app.exception_handler(DomainError)
    async def domain_error(request: Request, error: DomainError) -> JSONResponse:
        return _response(
            409 if isinstance(error, DuplicateEmail) else 400, trace_id(request), str(error)
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, error: RequestValidationError) -> JSONResponse:
        message = "; ".join(
            f"{'.'.join(str(part) for part in item['loc'])}: {item['msg']}"
            for item in error.errors()
        )
        return _response(400, trace_id(request), message)

    @app.exception_handler(HTTPException)
    async def http_error(request: Request, error: HTTPException) -> JSONResponse:
        message = "router not found" if error.status_code == 404 else str(error.detail)
        return _response(error.status_code, "middlware-001", message)

    @app.exception_handler(Exception)
    async def unexpected_error(request: Request, error: Exception) -> JSONResponse:
        logger.error("Request to %s failed with %s", request.url.path, type(error).__name__)
        return _response(500, trace_id(request), "internal server error")
