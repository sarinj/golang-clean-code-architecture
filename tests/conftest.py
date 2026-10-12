import os
from collections.abc import Iterator
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.schema import CreateSchema, DropSchema

from src.config.settings import Settings
from src.infrastructure.database.postgres import migration
from src.infrastructure.database.postgres.connector import PostgresConnector
from src.infrastructure.fastapi.application import create_app


@pytest.fixture
def database_url(tmp_path: Path) -> Iterator[str]:
    external_url = os.environ.get("TEST_DATABASE_URL")
    if external_url is None:
        yield f"sqlite:///{tmp_path / 'api.sqlite'}"
        return
    url = make_url(external_url)
    if url.get_backend_name() != "postgresql":
        raise ValueError("TEST_DATABASE_URL must point to PostgreSQL")
    schema = f"test_{uuid4().hex}"
    admin = create_engine(url, pool_pre_ping=True)
    try:
        with admin.begin() as connection:
            connection.execute(CreateSchema(schema))
        try:
            options = f"{url.query.get('options', '')} -csearch_path={schema}".strip()
            yield url.update_query_dict({"options": options}).render_as_string(hide_password=False)
        finally:
            with admin.begin() as connection:
                connection.execute(DropSchema(schema, cascade=True))
    finally:
        admin.dispose()


@pytest.fixture
def client(database_url: str) -> Iterator[TestClient]:
    settings = Settings(
        _env_file=None,
        secret_key="test-secret-with-at-least-thirty-two-characters",
        name="Migration Test API",
        database_url=database_url,
        jwt_access_expires=60,
        jwt_refresh_expires=600,
    )
    config = Config()
    config.set_main_option("script_location", str(Path(migration.__file__).parent))
    config.attributes["settings"] = settings
    command.upgrade(config, "head")

    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite:") else {}
    database = PostgresConnector(engine=create_engine(database_url, connect_args=connect_args))
    try:
        with TestClient(create_app(settings, postgres=database)) as api:
            yield api
    finally:
        database.close()


@pytest.fixture
def login(client: TestClient) -> dict:
    body = {
        "email": "user@example.com",
        "password": "example-password",
        "first_name": "Alex",
        "last_name": "Lee",
    }
    assert client.post("/api/v1/users/register", json=body).status_code == 201
    response = client.post("/api/v1/users/login", json=body)
    assert response.status_code == 200
    return response.json()
