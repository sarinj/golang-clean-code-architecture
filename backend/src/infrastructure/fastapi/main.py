import uvicorn

from src.config.settings import Settings
from src.infrastructure.fastapi.application import create_app

app = create_app()


def run() -> None:
    settings = Settings()
    uvicorn.run(
        "src.infrastructure.fastapi.main:app",
        host=settings.host,
        port=settings.port,
        access_log=True,
    )
