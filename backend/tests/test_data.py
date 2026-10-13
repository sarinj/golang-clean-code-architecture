import pytest
from fastapi.testclient import TestClient

from src.infrastructure.database.postgres.models import UserPermissionRow, UserRow


def _headers(login: dict) -> dict[str, str]:
    return {"Authorization": f"Bearer {login['token']['access']}"}


def test_data_requires_authentication(client: TestClient) -> None:
    for path in ("/api/v1/data/users/", "/api/v1/data/users/1", "/api/v1/data/users/describe"):
        response = client.get(path)
        assert response.status_code == 401
        assert response.json()["trace_id"] == "middlware-002"


def test_pagination_counts_all_records_and_redacts_passwords(
    client: TestClient, login: dict
) -> None:
    with client.app.state.postgres.session() as session:
        session.add_all(
            [
                UserRow(
                    email=f"user{index}@example.com",
                    password="stored-secret",
                    first_name="",
                    last_name="",
                )
                for index in range(11)
            ]
        )
    response = client.get(
        "/api/v1/data/users/", params={"_page": 2, "_pageSize": 5}, headers=_headers(login)
    )
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 2
    assert data["page_size"] == 5
    assert data["total_page"] == 3
    assert data["total_data"] == 12
    assert len(data["data"]) == 5
    assert [item["id"] for item in data["data"]] == [6, 7, 8, 9, 10]
    assert "password" not in response.text
    assert "stored-secret" not in response.text
    assert {field["name"] for field in data["data_schema"]["fields"]} == {
        "id",
        "email",
        "first_name",
        "last_name",
        "created_at",
        "updated_at",
    }
    last = client.get("/api/v1/data/users", params={"_page": 10}, headers=_headers(login)).json()
    assert last["data"] == []
    assert last["total_data"] == 12


@pytest.mark.parametrize(
    "page,size,expected_page,expected_size",
    [
        (0, 0, 1, 10),
        (-5, -1, 1, 10),
        (1, 1001, 1, 1000),
    ],
)
def test_pagination_limits(
    client: TestClient, login: dict, page: int, size: int, expected_page: int, expected_size: int
) -> None:
    response = client.get(
        "/api/v1/data/users/", params={"_page": page, "_pageSize": size}, headers=_headers(login)
    )
    assert response.status_code == 200
    assert response.json()["page"] == expected_page
    assert response.json()["page_size"] == expected_size


@pytest.mark.parametrize(
    "query,page,size",
    [
        ({"_page": "invalid", "_pageSize": "3"}, 1, 3),
        ({"_page": "2", "_pageSize": "invalid"}, 2, 10),
        ({"_page": "", "_pageSize": ""}, 1, 10),
        ({"_page": "1.0", "_pageSize": "1e2"}, 1, 10),
        ({"_page": " 2 ", "_pageSize": "１２"}, 1, 10),
        ({"_page": str(2**63), "_pageSize": str(2**63)}, 1, 10),
        ({"_page": "+1", "_pageSize": "0002"}, 1, 2),
        ({"page": "2", "pageSize": "2", "email": "missing@example.com"}, 1, 10),
    ],
)
def test_go_pagination_query_parsing(
    client: TestClient, login: dict, query: dict, page: int, size: int
) -> None:
    response = client.get("/api/v1/data/users/", params=query, headers=_headers(login))
    assert response.status_code == 200
    assert response.json()["page"] == page
    assert response.json()["page_size"] == size
    assert response.json()["total_data"] == 1


def test_retrieve_describe_and_nested_user_redaction(client: TestClient, login: dict) -> None:
    headers = _headers(login)
    user_id = login["user"]["id"]
    assert (
        client.get(f"/api/v1/data/users/{user_id}", headers=headers).json()["data"] == login["user"]
    )
    with client.app.state.postgres.session() as session:
        session.add(UserPermissionRow(user_id=user_id, permission="reader"))
    for slug in ("user-tokens", "user-permissions"):
        data = client.get(f"/api/v1/data/{slug}/", headers=headers)
        assert data.status_code == 200
        assert "password" not in data.text
        row = data.json()["data"][0]
        assert row["ID"] == 1
        assert row["UserId"] == user_id
        assert row["user"] == login["user"]
        schema = client.get(f"/api/v1/data/{slug}/describe", headers=headers)
        assert schema.status_code == 200
        assert "password" not in schema.text


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/data/missing/",
        "/api/v1/data/users/invalid",
        "/api/v1/data/users/999",
        "/api/v1/data/users/9999999999999999999999999",
        "/api/v1/data/users/?_page=9223372036854775807&_pageSize=10",
    ],
)
def test_data_errors(client: TestClient, login: dict, path: str) -> None:
    response = client.get(path, headers=_headers(login))
    assert response.status_code == 400
    assert response.json()["trace_id"] == "error"
