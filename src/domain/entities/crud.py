from dataclasses import dataclass
from enum import StrEnum
from typing import Any


class Datasource(StrEnum):
    POSTGRESQL = "postgresql"
    MONGODB = "mongodb"


@dataclass(frozen=True)
class CRUDModel:
    entity: type
    table_name: str
    datasource: Datasource = Datasource.POSTGRESQL

    @property
    def slug(self) -> str:
        return self.table_name.replace("_", "-")


@dataclass(frozen=True)
class DataResponse:
    data: dict[str, Any]
    data_schema: dict[str, Any]
    code: int = 0
    message: str = ""


@dataclass(frozen=True)
class DataListResponse:
    data: list[dict[str, Any]]
    page: int
    page_size: int
    total_page: int
    total_data: int
    data_schema: dict[str, Any]
    code: int = 0
    message: str = ""
