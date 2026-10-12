from collections.abc import AsyncIterator, Sequence
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from src.config.crud_models import ENTITY_MODELS
from src.config.settings import Settings
from src.domain.entities.crud import CRUDModel, Datasource
from src.infrastructure.database.mongodb.connector import MongoConnector
from src.infrastructure.database.postgres.connector import PostgresConnector
from src.interface.handlers.fastapi import crud, monitor, user
from src.interface.handlers.fastapi.errors import install_error_handlers
from src.interface.handlers.fastapi.schemas import ErrorResponse
from src.shared.authentication.jwt import JWTTokenService
from src.shared.authentication.password import BcryptPasswordHasher


def create_app(
    settings: Settings | None = None,
    *,
    postgres: PostgresConnector | None = None,
    models: Sequence[CRUDModel] = ENTITY_MODELS,
) -> FastAPI:
    settings = settings if settings is not None else Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        database = postgres if postgres is not None else PostgresConnector(settings.postgres_url)
        mongo = (
            MongoConnector(settings.mongodb_db_atlas_uri, settings.mongodb_db_name)
            if any(model.datasource == Datasource.MONGODB for model in models)
            else None
        )
        app.state.postgres = database
        app.state.mongo = mongo
        try:
            yield
        finally:
            if mongo is not None:
                mongo.close()
            if postgres is None:
                database.close()

    app = FastAPI(
        title=settings.name,
        version=settings.version,
        lifespan=lifespan,
        responses={"4XX": {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    )
    app.state.settings = settings
    app.state.models = models
    app.state.passwords = BcryptPasswordHasher()
    app.state.tokens = JWTTokenService(
        settings.secret_key,
        settings.name,
        settings.jwt_access_expires,
        settings.jwt_refresh_expires,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["GET", "POST", "HEAD", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
    )
    install_error_handlers(app)
    api = APIRouter()
    api.include_router(monitor.router, prefix="/api/v1")
    api.include_router(user.router, prefix="/api/v1")
    api.include_router(crud.router, prefix="/api/v1")
    app.include_router(api)

    @app.get("/swagger", include_in_schema=False)
    @app.get("/swagger/{path:path}", include_in_schema=False)
    def legacy_swagger() -> RedirectResponse:
        return RedirectResponse("/docs")

    return app
