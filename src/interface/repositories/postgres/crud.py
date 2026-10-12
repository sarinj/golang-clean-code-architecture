from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.domain.entities.crud import CRUDModel
from src.domain.errors import InvalidInput, NotFound
from src.infrastructure.database.postgres.models import POSTGRES_MODELS
from src.shared.crud.schema import generate_schema, public_data


class PostgresCRUDRepository:
    def __init__(self, session: Session, model: CRUDModel) -> None:
        self.session = session
        self.model = model
        self.row_type = POSTGRES_MODELS[model.entity]

    def get_one_by_id(self, entity_id: str) -> dict[str, Any]:
        try:
            row_id = int(entity_id)
        except ValueError as error:
            raise InvalidInput("id must be an integer") from error
        if not 0 < row_id <= 9223372036854775807:
            raise InvalidInput("id must be a positive 64-bit integer")
        row = self.session.get(self.row_type, row_id)
        if row is None:
            raise NotFound("record not found")
        return public_data(row.to_domain())

    def get_list(self, page: int, page_size: int) -> tuple[list[dict[str, Any]], int]:
        total = self.session.scalar(select(func.count()).select_from(self.row_type)) or 0
        rows = self.session.scalars(
            select(self.row_type)
            .order_by(self.row_type.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return [public_data(row.to_domain()) for row in rows], total

    def describe(self) -> dict[str, Any]:
        return generate_schema(self.model.entity)
