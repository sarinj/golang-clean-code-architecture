import json
from dataclasses import dataclass, field
from unittest.mock import Mock

import pytest
from bson import ObjectId
from pymongo.collection import Collection

from src.domain.entities.crud import CRUDModel, Datasource
from src.domain.errors import InvalidInput, NotFound
from src.interface.repositories.mongodb.crud import MongoCRUDRepository


@dataclass
class NestedUser:
    id: str
    name: str
    password: str = field(metadata={"public": False})


@dataclass
class Document:
    id: str
    title: str = field(metadata={"bson_name": "document_title"})
    user: NestedUser | None
    users: list[NestedUser]
    users_by_name: dict[str, NestedUser]
    secret: str = field(metadata={"public": False})


def _repository(collection: Mock) -> MongoCRUDRepository:
    return MongoCRUDRepository(
        collection,
        CRUDModel(entity=Document, table_name="documents", datasource=Datasource.MONGODB),
    )


def test_mongo_document_reads_redact_nested_private_fields() -> None:
    collection = Mock(spec=Collection)
    document_id, user_id = ObjectId(), ObjectId()
    nested = {"id": user_id, "name": "Alex", "password": "private-password", "extra": "ignored"}
    collection.find_one.return_value = {
        "_id": document_id,
        "document_title": "Example",
        "user": nested,
        "users": [nested],
        "users_by_name": {"alex": nested},
        "secret": "private-secret",
        "internal": "ignored",
    }
    repository = _repository(collection)
    response = repository.get_one_by_id(str(document_id))
    assert response == {
        "id": str(document_id),
        "title": "Example",
        "user": {"id": str(user_id), "name": "Alex"},
        "users": [{"id": str(user_id), "name": "Alex"}],
        "users_by_name": {"alex": {"id": str(user_id), "name": "Alex"}},
    }
    assert "private" not in json.dumps(response)
    assert "password" not in json.dumps(repository.describe())
    assert "secret" not in json.dumps(repository.describe())


def test_mongo_read_handles_invalid_and_missing_ids() -> None:
    collection = Mock(spec=Collection)
    repository = _repository(collection)
    with pytest.raises(InvalidInput):
        repository.get_one_by_id("invalid")
    collection.find_one.return_value = None
    with pytest.raises(NotFound):
        repository.get_one_by_id(str(ObjectId()))
