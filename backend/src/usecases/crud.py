from typing import Any

from src.domain.entities.crud import DataListResponse, DataResponse
from src.domain.errors import InvalidInput
from src.domain.repositories.crud import CRUDRepositoryFactory


class CRUDUsecase:
    def __init__(self, repositories: CRUDRepositoryFactory) -> None:
        self.repositories = repositories

    def retrieve(self, slug: str, entity_id: str) -> DataResponse:
        repository = self.repositories.get_repository(slug.strip())
        return DataResponse(
            data=repository.get_one_by_id(entity_id), data_schema=repository.describe()
        )

    def retrieve_list(self, slug: str, page: int = 1, page_size: int = 10) -> DataListResponse:
        page = max(1, page)
        page_size = min(1000, page_size) if page_size > 0 else 10
        if (page - 1) * page_size > 9223372036854775807:
            raise InvalidInput("page offset exceeds the database limit")
        repository = self.repositories.get_repository(slug.strip())
        data, count = repository.get_list(page, page_size)
        return DataListResponse(
            data=data,
            page=page,
            page_size=page_size,
            total_page=(count + page_size - 1) // page_size,
            total_data=count,
            data_schema=repository.describe(),
        )

    def describe(self, slug: str) -> dict[str, Any]:
        return self.repositories.get_repository(slug.strip()).describe()
