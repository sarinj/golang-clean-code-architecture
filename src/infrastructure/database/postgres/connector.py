from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import URL, Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker


class PostgresConnector:
    def __init__(self, url: str | URL | None = None, *, engine: Engine | None = None) -> None:
        if engine is None and url is None:
            raise ValueError("a database URL or engine is required")
        self.engine = engine if engine is not None else create_engine(url, pool_pre_ping=True)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)

    @contextmanager
    def session(self) -> Iterator[Session]:
        with self.sessions.begin() as session:
            yield session

    def close(self) -> None:
        self.engine.dispose()
