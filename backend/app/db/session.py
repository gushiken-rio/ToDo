from __future__ import annotations

from collections.abc import Generator
import time

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, col, create_engine, select

from app.core.config import settings
from app.models.category import Category
from app.models.user import User


connect_args = {}
if settings.database_url.startswith("sqlite"):
    # Needed for SQLite when using threads (e.g., TestClient, uvicorn workers).
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
)


def init_db() -> None:
    # Ensure models are imported so SQLModel registers tables into metadata.
    import app.models.category  # noqa: F401
    import app.models.task  # noqa: F401
    import app.models.task_assignee  # noqa: F401
    import app.models.user  # noqa: F401

    last_error: Exception | None = None
    for _ in range(30):
        try:
            SQLModel.metadata.create_all(engine)
            _migrate_task_status_column()
            _seed_defaults()
            return
        except Exception as exc:  # pragma: no cover - startup resilience
            last_error = exc
            time.sleep(2)
    assert last_error is not None
    raise RuntimeError("Database initialization failed after retries") from last_error


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def _seed_defaults() -> None:
    """Create base master data for backward compatibility and future extensions."""
    with Session(engine) as session:
        existing_user = session.exec(
            select(User).where(col(User.deleted_at).is_(None)).order_by(col(User.id).asc()).limit(1)
        ).first()
        if existing_user is None:
            session.add(User(email="owner@example.com", name="Owner"))

        existing_category = session.exec(
            select(Category).where(col(Category.deleted_at).is_(None)).order_by(col(Category.id).asc()).limit(1)
        ).first()
        if existing_category is None:
            session.add(Category(name="General"))

        session.commit()


def _migrate_task_status_column() -> None:
    """Backfill and normalize status values for t_tasks."""
    with engine.begin() as conn:
        inspector = inspect(conn)
        if not inspector.has_table("t_tasks"):
            return

        column_names = {c["name"] for c in inspector.get_columns("t_tasks")}
        if "status" not in column_names:
            conn.execute(text("ALTER TABLE t_tasks ADD COLUMN status INTEGER NOT NULL DEFAULT 0"))
            if "is_done" in column_names:
                conn.execute(text("UPDATE t_tasks SET status = CASE WHEN is_done = 1 THEN 1 ELSE 0 END"))

        # Normalize legacy values (2, 3, etc.) into current binary status.
        conn.execute(text("UPDATE t_tasks SET status = CASE WHEN status = 1 THEN 1 ELSE 0 END"))


