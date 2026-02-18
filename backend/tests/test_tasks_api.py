from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.db.session import get_session
from app.main import app as fastapi_app


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    import importlib

    importlib.import_module("app.models.task")

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def _get_session_override() -> Generator[Session, None, None]:
        with Session(engine) as session:
            yield session

    fastapi_app.dependency_overrides[get_session] = _get_session_override
    with TestClient(fastapi_app) as c:
        yield c
    fastapi_app.dependency_overrides.clear()


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_task_crud_flow(client: TestClient) -> None:
    # create
    r = client.post("/v1/tasks", json={"title": "A", "description": "B"})
    assert r.status_code == 201
    created = r.json()
    assert created["title"] == "A"
    assert created["description"] == "B"
    assert created["is_done"] is False
    task_id = created["id"]

    # list
    r = client.get("/v1/tasks")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == task_id

    # update
    r = client.patch(f"/v1/tasks/{task_id}", json={"title": "A2"})
    assert r.status_code == 200
    assert r.json()["title"] == "A2"

    # toggle
    r = client.patch(f"/v1/tasks/{task_id}/toggle")
    assert r.status_code == 200
    assert r.json()["is_done"] is True

    # filter done
    r = client.get("/v1/tasks?status=done")
    assert r.status_code == 200
    assert r.json()["total"] == 1

    # delete
    r = client.delete(f"/v1/tasks/{task_id}")
    assert r.status_code == 204

    # gone
    r = client.get(f"/v1/tasks/{task_id}")
    assert r.status_code == 404


