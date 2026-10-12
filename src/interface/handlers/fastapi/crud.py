from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query

from src.domain.entities.crud import DataListResponse, DataResponse
from src.interface.handlers.fastapi.dependencies import ApplicationDependency, authenticated_user
from src.interface.handlers.fastapi.schemas import ErrorResponse

router = APIRouter(
    prefix="/data",
    tags=["Data"],
    dependencies=[Depends(authenticated_user)],
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)


@router.get("/{entity_model_slug}/describe")
def describe(entity_model_slug: str, application: ApplicationDependency) -> dict[str, Any]:
    return application.crud.describe(entity_model_slug)


@router.get("/{entity_model_slug}/", response_model=DataListResponse)
@router.get("/{entity_model_slug}", response_model=DataListResponse, include_in_schema=False)
def retrieve_list(
    entity_model_slug: str,
    application: ApplicationDependency,
    page: Annotated[int, Query(alias="_page")] = 1,
    page_size: Annotated[int, Query(alias="_pageSize")] = 10,
) -> DataListResponse:
    return application.crud.retrieve_list(entity_model_slug, page, page_size)


@router.get("/{entity_model_slug}/{entity_id}", response_model=DataResponse)
def retrieve(
    entity_model_slug: str, entity_id: str, application: ApplicationDependency
) -> DataResponse:
    return application.crud.retrieve(entity_model_slug, entity_id)
