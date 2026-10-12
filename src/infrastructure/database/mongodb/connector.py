from typing import Any

from pymongo import MongoClient
from pymongo.database import Database


class MongoConnector:
    def __init__(self, uri: str, database_name: str) -> None:
        self.client: MongoClient[dict[str, Any]] = MongoClient(
            uri, connect=False, serverSelectionTimeoutMS=5000, tz_aware=True
        )
        self.database: Database[dict[str, Any]] = self.client[database_name]

    def close(self) -> None:
        self.client.close()
