import time

import bcrypt
import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event, select

from src.infrastructure.database.postgres.models import UserRow, UserTokenRow


def _headers(login: dict) -> dict[str, str]:
    return {"Authorization": f"Bearer {login['token']['access']}"}


def _claims(client: TestClient, token: str) -> dict:
    settings = client.app.state.settings
    return jwt.decode(
        token,
        settings.secret_key,
        algorithms=["HS256"],
        audience="user",
        issuer=settings.name.lower(),
    )


def test_authentication_lifecycle(client: TestClient, login: dict) -> None:
    user = login["user"]
    assert user["email"] == "user@example.com"
    assert user["first_name"] == "Alex"
    assert "password" not in user
    assert client.post("/api/v1/users/profile", headers=_headers(login)).json() == user

    with client.app.state.postgres.session() as session:
        stored = session.get(UserRow, user["id"])
        assert stored.password != "example-password"
        assert bcrypt.checkpw(b"example-password", stored.password.encode())

    access = _claims(client, login["token"]["access"])
    refresh = _claims(client, login["token"]["refresh"])
    assert access["exp"] - access["iat"] == 60
    assert refresh["exp"] - refresh["iat"] == 600

    response = client.post(
        "/api/v1/users/refresh-token", json={"refresh_token": login["token"]["refresh"]}
    )
    assert response.status_code == 200
    renewed = response.json()
    assert renewed["user"] == user
    assert renewed["token"] != login["token"]
    assert _claims(client, renewed["token"]["refresh"])["exp"] == refresh["exp"]
    assert client.post("/api/v1/users/profile", headers=_headers(login)).status_code == 401
    assert (
        client.post(
            "/api/v1/users/refresh-token", json={"refresh_token": login["token"]["refresh"]}
        ).status_code
        == 400
    )
    assert client.post("/api/v1/users/profile", headers=_headers(renewed)).status_code == 200

    logout = client.post(
        "/api/v1/users/logout", json={"refresh_token": renewed["token"]["refresh"]}
    )
    assert logout.status_code == 200
    assert logout.json() is None
    assert client.post("/api/v1/users/profile", headers=_headers(renewed)).status_code == 401
    assert (
        client.post(
            "/api/v1/users/refresh-token", json={"refresh_token": renewed["token"]["refresh"]}
        ).status_code
        == 400
    )


def test_login_replaces_existing_session(client: TestClient, login: dict) -> None:
    second = client.post(
        "/api/v1/users/login", json={"email": "user@example.com", "password": "example-password"}
    ).json()
    assert second["token"] != login["token"]
    assert client.post("/api/v1/users/profile", headers=_headers(login)).status_code == 401
    assert client.post("/api/v1/users/profile", headers=_headers(second)).status_code == 200
    with client.app.state.postgres.session() as session:
        assert len(session.scalars(select(UserTokenRow)).all()) == 1


def test_failed_login_and_duplicate_registration(client: TestClient, login: dict) -> None:
    duplicate = client.post(
        "/api/v1/users/register", json={"email": "user@example.com", "password": "other-password"}
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["trace_id"] == "users-001"
    for email, password in (
        ("user@example.com", "wrong-password"),
        ("missing@example.com", "example-password"),
    ):
        error = client.post("/api/v1/users/login", json={"email": email, "password": password})
        assert error.status_code == 400
        assert error.json()["trace_id"] == "users-002"
    assert client.post("/api/v1/users/profile", headers=_headers(login)).status_code == 200


def test_token_types_signatures_and_expiry(client: TestClient, login: dict) -> None:
    assert (
        client.post(
            "/api/v1/users/refresh-token", json={"refresh_token": login["token"]["access"]}
        ).status_code
        == 400
    )
    assert (
        client.post(
            "/api/v1/users/logout", json={"refresh_token": login["token"]["access"]}
        ).status_code
        == 400
    )
    assert (
        client.post(
            "/api/v1/users/profile",
            headers={"Authorization": f"Bearer {login['token']['refresh']}"},
        ).status_code
        == 401
    )

    settings = client.app.state.settings
    payload = _claims(client, login["token"]["access"])
    bad_signature = jwt.encode(
        payload, "a-different-secret-at-least-thirty-two-characters", "HS256"
    )
    payload["exp"] = int(time.time()) - 1
    expired = jwt.encode(payload, settings.secret_key, "HS256")
    for token in (bad_signature, expired, "not-a-token"):
        response = client.post(
            "/api/v1/users/profile", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 401
        assert response.json()["trace_id"] == "middlware-002"


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"email": "bad", "password": "secret"},
        {"email": "user@example.com", "password": ""},
        {"email": "user@example.com", "password": "é" * 37},
    ],
)
def test_invalid_registration(client: TestClient, body: dict) -> None:
    response = client.post("/api/v1/users/register", json=body)
    assert response.status_code == 400
    assert response.json()["trace_id"] == "users-001"


def test_bad_json_and_unknown_routes(client: TestClient) -> None:
    response = client.post(
        "/api/v1/users/login", content="{", headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 400
    assert response.json()["trace_id"] == "users-002"
    response = client.get("/does-not-exist")
    assert response.status_code == 404
    assert response.json() == {"trace_id": "middlware-001", "message": "router not found"}


def test_monitor_docs_and_cors(client: TestClient) -> None:
    for path in ("/api/v1/", "/api/v1"):
        assert client.get(path).json() == {"name": "Migration Test API", "version": "0.1.0"}
    assert client.get("/docs").status_code == 200
    assert client.get("/swagger/").status_code == 200
    paths = client.get("/openapi.json").json()["paths"]
    assert "post" in paths["/api/v1/users/profile"]
    assert "400" in paths["/api/v1/users/register"]["post"]["responses"]
    assert "422" not in paths["/api/v1/users/register"]["post"]["responses"]
    assert "get" in paths["/api/v1/data/{entity_model_slug}/describe"]
    cors = client.options(
        "/api/v1/users/profile",
        headers={
            "Origin": "https://example.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert cors.status_code == 200
    assert cors.headers["access-control-allow-origin"] == "*"


def test_existing_go_hash_and_jwt_session(client: TestClient) -> None:
    settings = client.app.state.settings
    with client.app.state.postgres.session() as session:
        row = UserRow(
            email="Legacy@Example.COM",
            password=bcrypt.hashpw(
                b"legacy-password", bcrypt.gensalt(rounds=10, prefix=b"2a")
            ).decode(),
            first_name="Legacy",
            last_name="User",
        )
        session.add(row)
        session.flush()
        user_id = row.id
        now = int(time.time())

        def old_token(kind: str) -> str:
            return jwt.encode(
                {
                    "claims": {"id": user_id},
                    "iss": settings.name.lower(),
                    "sub": f"{kind}-token",
                    "aud": ["user", "admin"],
                    "exp": now + 600,
                    "nbf": now,
                    "iat": now,
                },
                settings.secret_key,
                "HS256",
            )

        access, refresh = old_token("access"), old_token("refresh")
        session.add(UserTokenRow(user_id=user_id, access=access, refresh=refresh))

    profile = client.post("/api/v1/users/profile", headers={"Authorization": f"Bearer {access}"})
    assert profile.status_code == 200
    assert profile.json()["id"] == user_id
    assert (
        client.post("/api/v1/users/refresh-token", json={"refresh_token": refresh}).status_code
        == 200
    )
    assert (
        client.post(
            "/api/v1/users/login",
            json={"email": "Legacy@Example.COM", "password": "legacy-password"},
        ).status_code
        == 200
    )


def test_failed_commit_rolls_back_and_returns_error(client: TestClient) -> None:
    sessions = client.app.state.postgres.sessions

    def fail_commit(session) -> None:
        raise RuntimeError("database commit failed")

    event.listen(sessions, "before_commit", fail_commit)
    body = {"email": "rollback@example.com", "password": "example-password"}
    try:
        with TestClient(client.app, raise_server_exceptions=False) as failing_client:
            response = failing_client.post("/api/v1/users/register", json=body)
        assert response.status_code == 500
        assert response.json() == {"trace_id": "users-001", "message": "internal server error"}
    finally:
        event.remove(sessions, "before_commit", fail_commit)
    assert client.post("/api/v1/users/register", json=body).status_code == 201
