import os
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import uuid4

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient
from pymongo import MongoClient

from src.config.crud_models import ENTITY_MODELS
from src.domain.entities.crud import CRUDModel, Datasource
from src.infrastructure.fastapi.application import create_app

postgres_required = pytest.mark.skipif(
    not os.environ.get("TEST_DATABASE_URL"), reason="TEST_DATABASE_URL is required"
)
mongo_required = pytest.mark.skipif(
    not os.environ.get("TEST_MONGODB_URI"), reason="TEST_MONGODB_URI is required"
)


@postgres_required
def test_concurrent_registration_creates_one_account(client: TestClient) -> None:
    body = {"email": "concurrent@example.com", "password": "example-password"}

    def register(index: int) -> int:
        return client.post("/api/v1/users/register", json=body).status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        statuses = list(executor.map(register, range(2)))
    assert sorted(statuses) == [201, 409]
    assert client.post("/api/v1/users/login", json=body).status_code == 200


@postgres_required
def test_refresh_token_can_only_be_used_once_concurrently(client: TestClient, login: dict) -> None:
    body = {"refresh_token": login["token"]["refresh"]}

    def refresh(index: int):
        return client.post("/api/v1/users/refresh-token", json=body)

    with ThreadPoolExecutor(max_workers=2) as executor:
        responses = list(executor.map(refresh, range(2)))
    assert sorted(response.status_code for response in responses) == [200, 400]
    renewed = next(response.json() for response in responses if response.status_code == 200)
    headers = {"Authorization": f"Bearer {renewed['token']['access']}"}
    assert client.post("/api/v1/users/profile", headers=headers).status_code == 200
    old_headers = {"Authorization": f"Bearer {login['token']['access']}"}
    assert client.post("/api/v1/users/profile", headers=old_headers).status_code == 401


@dataclass
class MongoDocument:
    id: str
    title: str
    created_at: datetime
    secret: str = field(metadata={"public": False})


@mongo_required
def test_mongodb_authenticated_reads_and_pagination(client: TestClient, login: dict) -> None:
    uri = os.environ["TEST_MONGODB_URI"]
    database_name = f"test_{uuid4().hex}"
    settings = client.app.state.settings.model_copy(
        update={"mongodb_db_atlas_uri": uri, "mongodb_db_name": database_name}
    )
    model = CRUDModel(entity=MongoDocument, table_name="documents", datasource=Datasource.MONGODB)
    headers = {"Authorization": f"Bearer {login['token']['access']}"}
    with MongoClient(uri, serverSelectionTimeoutMS=5000) as mongo:
        try:
            ids = (
                mongo[database_name]["documents"]
                .insert_many(
                    [
                        {
                            "title": f"Document {index}",
                            "created_at": datetime.now(UTC),
                            "secret": "private-value",
                        }
                        for index in range(12)
                    ]
                )
                .inserted_ids
            )
            app = create_app(
                settings, postgres=client.app.state.postgres, models=(*ENTITY_MODELS, model)
            )
            with TestClient(app) as api:
                assert api.get("/api/v1/data/documents/").status_code == 401
                response = api.get(
                    "/api/v1/data/documents/",
                    params={"_page": 2, "_pageSize": 5},
                    headers=headers,
                )
                assert response.status_code == 200
                page = response.json()
                assert page["total_data"] == 12
                assert page["total_page"] == 3
                assert [record["id"] for record in page["data"]] == [
                    str(item) for item in ids[5:10]
                ]
                assert "secret" not in response.text
                assert "private-value" not in response.text
                record = api.get(f"/api/v1/data/documents/{ids[0]}", headers=headers)
                assert record.status_code == 200
                assert record.json()["data"]["id"] == str(ids[0])
                assert "secret" not in record.text
                schema = api.get("/api/v1/data/documents/describe", headers=headers)
                assert schema.status_code == 200
                assert "secret" not in schema.text
                assert api.get("/api/v1/data/documents/invalid", headers=headers).status_code == 400
                assert (
                    api.get(f"/api/v1/data/documents/{ObjectId()}", headers=headers).status_code
                    == 400
                )
        finally:
            mongo.drop_database(database_name)
