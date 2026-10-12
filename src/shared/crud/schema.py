import re
from dataclasses import fields, is_dataclass
from datetime import datetime
from types import UnionType
from typing import Any, Union, get_args, get_origin, get_type_hints


def public_data(value: Any) -> Any:
    if is_dataclass(value) and not isinstance(value, type):
        return {
            field.metadata.get("json_name", field.name): public_data(getattr(value, field.name))
            for field in fields(value)
            if field.metadata.get("public", True)
        }
    if isinstance(value, list):
        return [public_data(item) for item in value]
    if isinstance(value, dict):
        return {key: public_data(item) for key, item in value.items()}
    return value


def _name(entity: type) -> str:
    name = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", entity.__name__)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name).lower().replace("_", "-")


def _schema_type(annotation: Any) -> Any:
    if get_origin(annotation) in (UnionType, Union):
        return [_schema_type(member) for member in get_args(annotation)]
    if annotation is type(None):
        return "null"
    if annotation in (str, int, float, bool, datetime, bytes):
        return {
            str: "string",
            int: "int",
            float: "double",
            bool: "boolean",
            datetime: "datetime",
            bytes: "bytes",
        }[annotation]
    if is_dataclass(annotation):
        return _name(annotation)
    if get_origin(annotation) is list:
        return {"type": "array", "items": _schema_type(get_args(annotation)[0])}
    if get_origin(annotation) is dict:
        return "map"
    return "unknown"


def generate_schema(entity: type) -> dict[str, Any]:
    hints = get_type_hints(entity)
    schema_fields = []
    for field in fields(entity):
        if not field.metadata.get("public", True):
            continue
        annotation = hints[field.name]
        field_schema = {
            "name": field.metadata.get("json_name", field.name),
            "type": _schema_type(annotation),
        }
        members = get_args(annotation) if get_origin(annotation) in (UnionType, Union) else ()
        nested = next((item for item in (annotation, *members) if is_dataclass(item)), None)
        if nested is not None:
            field_schema["fields"] = generate_schema(nested)
        schema_fields.append(field_schema)
    return {"type": "record", "name": _name(entity), "fields": schema_fields}
