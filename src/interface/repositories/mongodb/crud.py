from dataclasses import fields, is_dataclass
from types import UnionType
from typing import Any, Union, get_args, get_origin, get_type_hints

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.collection import Collection

from src.domain.entities.crud import CRUDModel
from src.domain.errors import InvalidInput, NotFound
from src.shared.crud.schema import generate_schema


def _json_value(value: Any, annotation: Any = None) -> Any:
    if get_origin(annotation) in (Union, UnionType):
        annotation = next(member for member in get_args(annotation) if member is not type(None))
    if is_dataclass(annotation) and isinstance(value, dict):
        return _public_document(annotation, value)
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, dict):
        value_type = get_args(annotation)[1] if get_origin(annotation) is dict else None
        return {key: _json_value(item, value_type) for key, item in value.items()}
    if isinstance(value, list):
        item_type = get_args(annotation)[0] if get_origin(annotation) is list else None
        return [_json_value(item, item_type) for item in value]
    return value


def _public_document(entity: type, document: dict[str, Any]) -> dict[str, Any]:
    result = {}
    hints = get_type_hints(entity)
    for field in fields(entity):
        if not field.metadata.get("public", True):
            continue
        default_key = "_id" if field.name == "id" and "_id" in document else field.name
        key = field.metadata.get("bson_name", default_key)
        if key in document:
            result[field.metadata.get("json_name", field.name)] = _json_value(
                document[key], hints[field.name]
            )
    return result


class MongoCRUDRepository:
    def __init__(self, collection: Collection[dict[str, Any]], model: CRUDModel) -> None:
        self.collection = collection
        self.model = model

    def get_one_by_id(self, entity_id: str) -> dict[str, Any]:
        try:
            object_id = ObjectId(entity_id)
        except InvalidId as error:
            raise InvalidInput("id must be a valid MongoDB ObjectId") from error
        document = self.collection.find_one({"_id": object_id})
        if document is None:
            raise NotFound("record not found")
        return _public_document(self.model.entity, document)

    def get_list(self, page: int, page_size: int) -> tuple[list[dict[str, Any]], int]:
        total = self.collection.count_documents({})
        cursor = (
            self.collection.find({}).sort("_id", 1).skip((page - 1) * page_size).limit(page_size)
        )
        with cursor:
            return [_public_document(self.model.entity, document) for document in cursor], total

    def describe(self) -> dict[str, Any]:
        return generate_schema(self.model.entity)
