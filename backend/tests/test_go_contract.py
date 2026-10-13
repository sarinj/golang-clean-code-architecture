import json
from datetime import datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.infrastructure.database.postgres.models import UserPermissionRow


@pytest.fixture(scope="module")
def go_contract() -> dict:
    return json.loads((Path(__file__).parent / "fixtures" / "go_contract.json").read_text())


def _json_types(value):
    if isinstance(value, dict):
        return {key: _json_types(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_types(item) for item in value]
    return type(value)


def _assert_user(actual: dict, expected: dict) -> None:
    assert _json_types(actual) == _json_types(expected)
    assert actual["id"] > 0
    for key in ("email", "first_name", "last_name"):
        assert actual[key] == expected[key]
    for key in ("created_at", "updated_at"):
        assert datetime.fromisoformat(actual[key]).tzinfo is not None


def test_go_authentication_request_and_response_bodies(
    client: TestClient, go_contract: dict
) -> None:
    requests, responses = go_contract["requests"], go_contract["responses"]
    registration = client.post("/api/v1/users/register", json=requests["register"])
    assert registration.status_code == 201
    _assert_user(registration.json(), responses["register"])

    login = client.post("/api/v1/users/login", json=requests["login"])
    assert login.status_code == 200
    result = login.json()
    assert _json_types(result) == _json_types(responses["login"])
    _assert_user(result["user"], responses["profile"])
    assert all(result["token"].values())
    profile = client.post(
        "/api/v1/users/profile",
        headers={"Authorization": f"Bearer {result['token']['access']}"},
    )
    assert profile.status_code == 200
    assert profile.json() == registration.json()

    refresh = client.post(
        "/api/v1/users/refresh-token",
        json={key: result["token"]["refresh"] for key in requests["refresh"]},
    )
    assert refresh.status_code == 200
    renewed = refresh.json()
    assert _json_types(renewed) == _json_types(responses["login"])
    assert renewed["user"] == registration.json()
    logout = client.post(
        "/api/v1/users/logout",
        json={key: renewed["token"]["refresh"] for key in requests["logout"]},
    )
    assert logout.status_code == 200
    assert logout.json() == responses["logout"]


def test_go_request_fields_and_registered_methods(client: TestClient, go_contract: dict) -> None:
    document = client.get("/openapi.json").json()
    for action in ("register", "login", "refresh", "logout"):
        route = "refresh-token" if action == "refresh" else action
        operation = document["paths"][f"/api/v1/users/{route}"]["post"]
        reference = operation["requestBody"]["content"]["application/json"]["schema"]["$ref"]
        schema = document["components"]["schemas"][reference.rsplit("/", 1)[-1]]
        assert set(schema["properties"]) == set(go_contract["requests"][action])
        assert all(field["type"] == "string" for field in schema["properties"].values())
    assert set(document["paths"]["/api/v1/users/profile"]) == {"post"}
    operation = document["paths"]["/api/v1/data/{entity_model_slug}/"]["get"]
    query = {
        item["name"]: item["schema"] for item in operation["parameters"] if item["in"] == "query"
    }
    assert set(query) == {"_page", "_pageSize"}
    assert query["_page"]["type"] == query["_pageSize"]["type"] == "integer"


def test_go_data_envelopes_and_record_keys(
    client: TestClient, login: dict, go_contract: dict
) -> None:
    headers = {"Authorization": f"Bearer {login['token']['access']}"}
    responses = go_contract["responses"]
    with client.app.state.postgres.session() as session:
        session.add(UserPermissionRow(user_id=login["user"]["id"], permission="reader"))

    for slug, record_key in (
        ("users", "user_record"),
        ("user-tokens", "token_record"),
        ("user-permissions", "permission_record"),
    ):
        listing = client.get(f"/api/v1/data/{slug}/", headers=headers)
        assert listing.status_code == 200
        body = listing.json()
        assert set(body) == set(responses["list"])
        assert body["code"] == 0
        assert body["message"] == ""
        assert (body["page"], body["page_size"], body["total_page"], body["total_data"]) == (
            1,
            10,
            1,
            1,
        )
        record = body["data"][0]
        assert _json_types(record) == _json_types(responses[record_key])
        identifier = record["id"] if slug == "users" else record["ID"]
        detail = client.get(f"/api/v1/data/{slug}/{identifier}", headers=headers)
        assert detail.status_code == 200
        assert set(detail.json()) == set(responses["detail"])
        assert detail.json()["data"] == record
        assert detail.json()["data_schema"] == body["data_schema"]
        description = client.get(f"/api/v1/data/{slug}/describe", headers=headers)
        assert description.status_code == 200
        schema = description.json()
        assert schema == body["data_schema"]
        assert schema["name"] == go_contract["schemas"][slug]["name"]
        assert schema["type"] == "record"
        assert {field["name"] for field in schema["fields"]} == set(record)
        if slug != "users":
            user_field = next(field for field in schema["fields"] if field["name"] == "user")
            original = next(
                field for field in go_contract["schemas"][slug]["fields"] if field["name"] == "user"
            )
            assert user_field["type"] == [original["type"], "null"]
            assert user_field["fields"]["name"] == original["type"]
            assert {field["name"] for field in user_field["fields"]["fields"]} == set(login["user"])


@pytest.mark.parametrize(
    "path,status,trace",
    [
        ("/api/v1/users/register", 400, "users-001"),
        ("/api/v1/users/login", 400, "users-002"),
        ("/api/v1/users/refresh-token", 400, "users-003"),
        ("/api/v1/users/logout", 400, "users-004"),
        ("/api/v1/users/profile", 401, "middlware-002"),
    ],
)
def test_error_body_keys(
    client: TestClient, go_contract: dict, path: str, status: int, trace: str
) -> None:
    response = client.post(path, json={})
    assert response.status_code == status
    assert _json_types(response.json()) == _json_types(go_contract["responses"]["error"])
    assert response.json()["trace_id"] == trace


def test_go_monitor_response(client: TestClient, go_contract: dict) -> None:
    response = client.get("/api/v1/")
    assert response.status_code == 200
    assert response.json() == go_contract["responses"]["monitor"]
