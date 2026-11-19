from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setenv("SHETU_ENVIRONMENT", "test")
    monkeypatch.setenv("SHETU_DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}")
    monkeypatch.setenv("SHETU_AI_PROVIDER", "replay")
    monkeypatch.setenv("SHETU_AI_RECORD", "false")

    from shetu_api import config, db
    from shetu_api.ai import gateway

    for cached in (config.get_settings, db.get_engine, db.get_sessionmaker, gateway.get_gateway):
        cached.cache_clear()

    from shetu_api.main import create_app

    with TestClient(create_app()) as c:
        yield c

    db.get_engine().dispose()
    for cached in (config.get_settings, db.get_engine, db.get_sessionmaker, gateway.get_gateway):
        cached.cache_clear()


def as_(persona: str) -> dict[str, str]:
    return {"X-Shetu-Persona": persona}
