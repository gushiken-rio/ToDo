from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TaskAssignee(SQLModel, table=True):
    __tablename__ = "t_task_assignees"
    __table_args__ = (UniqueConstraint("assigned_id", "task_id", name="uq_task_assignees_assigned_task"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    assigned_id: int = Field(foreign_key="t_users.id", index=True)
    task_id: int = Field(foreign_key="t_tasks.id", index=True)

    created_at: datetime = Field(default_factory=utc_now, index=True)
    updated_at: datetime = Field(default_factory=utc_now, index=True)
    deleted_at: Optional[datetime] = Field(default=None, index=True)
