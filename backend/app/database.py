from copy import deepcopy

from bson import ObjectId
from neo4j import GraphDatabase
from pymongo import MongoClient

from app.config import settings


class InsertResult:
    def __init__(self, inserted_id: ObjectId):
        self.inserted_id = inserted_id


class LocalCollection:
    def __init__(self) -> None:
        self._rows: list[dict] = []

    def _matches(self, row: dict, query: dict) -> bool:
        return all(row.get(key) == value for key, value in query.items())

    def find_one(self, query: dict, projection: dict | None = None) -> dict | None:
        for row in self._rows:
            if self._matches(row, query):
                result = deepcopy(row)
                if projection:
                    for field, include in projection.items():
                        if include == 0:
                            result.pop(field, None)
                return result
        return None

    def insert_one(self, document: dict) -> InsertResult:
        doc = deepcopy(document)
        doc["_id"] = ObjectId()
        self._rows.append(doc)
        return InsertResult(doc["_id"])

    def find(self, query: dict) -> list[dict]:
        return [deepcopy(row) for row in self._rows if self._matches(row, query)]

    def update_one(self, query: dict, update: dict) -> None:
        for row in self._rows:
            if self._matches(row, query):
                set_payload = update.get("$set", {})
                row.update(set_payload)
                return


class LocalDatabase:
    def __init__(self) -> None:
        self._collections: dict[str, LocalCollection] = {}

    def __getitem__(self, item: str) -> LocalCollection:
        if item not in self._collections:
            self._collections[item] = LocalCollection()
        return self._collections[item]


class NoOpNeo4jSession:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def run(self, *args, **kwargs) -> None:
        return None


class NoOpNeo4jDriver:
    def session(self) -> NoOpNeo4jSession:
        return NoOpNeo4jSession()


if settings.storage_mode == "local":
    mongo_db = LocalDatabase()
    neo4j_driver = NoOpNeo4jDriver()
else:
    mongo_client = MongoClient(settings.mongodb_uri)
    mongo_db = mongo_client[settings.mongodb_db]
    neo4j_driver = GraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_user, settings.neo4j_password),
    )

