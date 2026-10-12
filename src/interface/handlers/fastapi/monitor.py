from fastapi import APIRouter, Request

from src.domain.entities.monitor import Monitor

router = APIRouter(tags=["Monitor"])


@router.get("/", response_model=Monitor)
@router.get("", response_model=Monitor, include_in_schema=False)
def health_check(request: Request) -> Monitor:
    settings = request.app.state.settings
    return Monitor(name=settings.name, version=settings.version)
