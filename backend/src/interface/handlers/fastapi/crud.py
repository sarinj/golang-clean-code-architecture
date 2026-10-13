import re
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from pydantic import BeforeValidator

from src.domain.entities.crud import DataListResponse, DataResponse
from src.interface.handlers.fastapi.dependencies import ApplicationDependency, authenticated_user
from src.interface.handlers.fastapi.schemas import ErrorResponse

router = APIRouter(
    prefix="/data",
    tags=["Data"],
    dependencies=[Depends(authenticated_user)],
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)


def _pagination_integer(value: Any, default: int) -> int:
    if not re.fullmatch(r"[+-]?[0-9]+", str(value)):
        return default
    try:
        number = int(value)
    except ValueError:
        return default
    return number if -(2**63) <= number < 2**63 else default


@router.get("/{entity_model_slug}/describe")
def describe(entity_model_slug: str, application: ApplicationDependency) -> dict[str, Any]:
    return application.crud.describe(entity_model_slug)


@router.get("/{entity_model_slug}/", response_model=DataListResponse)
@router.get("/{entity_model_slug}", response_model=DataListResponse, include_in_schema=False)
def retrieve_list(
    entity_model_slug: str,
    application: ApplicationDependency,
    page: Annotated[
        int, Query(alias="_page"), BeforeValidator(lambda value: _pagination_integer(value, 1))
    ] = 1,
    page_size: Annotated[
        int, Query(alias="_pageSize"), BeforeValidator(lambda value: _pagination_integer(value, 10))
    ] = 10,
) -> DataListResponse:
    return application.crud.retrieve_list(entity_model_slug, page, page_size)


@router.get("/{entity_model_slug}/{entity_id}", response_model=DataResponse)
def retrieve(
    entity_model_slug: str, entity_id: str, application: ApplicationDependency
) -> DataResponse:
    return application.crud.retrieve(entity_model_slug, entity_id)
