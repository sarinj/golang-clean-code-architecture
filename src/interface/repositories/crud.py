from collections.abc import Sequence

from sqlalchemy.orm import Session

from src.domain.entities.crud import CRUDModel, Datasource
from src.domain.errors import NotFound
from src.domain.repositories.crud import CRUDRepository
from src.infrastructure.database.mongodb.connector import MongoConnector
from src.interface.repositories.mongodb.crud import MongoCRUDRepository
from src.interface.repositories.postgres.crud import PostgresCRUDRepository


class RepositoryFactory:
    def __init__(
        self, session: Session, mongo: MongoConnector | None, models: Sequence[CRUDModel]
    ) -> None:
        self.session = session
        self.mongo = mongo
        self.models = {model.slug: model for model in models}

    def get_repository(self, slug: str) -> CRUDRepository:
        model = self.models.get(slug)
        if model is None:
            raise NotFound("Entity model not found")
        if model.datasource == Datasource.POSTGRESQL:
            return PostgresCRUDRepository(self.session, model)
        if model.datasource == Datasource.MONGODB and self.mongo is not None:
            return MongoCRUDRepository(self.mongo.database[model.table_name], model)
        raise NotFound("Datasource not supported")
