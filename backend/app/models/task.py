from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


TASK_STATUS_TODO = 0
TASK_STATUS_DONE = 1


class Task(SQLModel, table=True):
    __tablename__ = "t_tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="t_users.id", index=True)
    cat_id: int = Field(foreign_key="m_categories.id", index=True)
    title: str = Field(min_length=1, max_length=200, index=True)
    description: Optional[str] = Field(default=None, max_length=4000)
    status: int = Field(default=TASK_STATUS_TODO, ge=0, le=1, index=True)
    finish_date: Optional[datetime] = Field(default=None, index=True)

    created_at: datetime = Field(default_factory=utc_now, index=True)
    updated_at: datetime = Field(default_factory=utc_now, index=True)
    deleted_at: Optional[datetime] = Field(default=None, index=True)

    @property
    def is_done(self) -> bool:
        """Backward compatible field used by current frontend."""
        return self.status == TASK_STATUS_DONE

    @is_done.setter
    def is_done(self, value: bool) -> None:
        self.status = TASK_STATUS_DONE if value else TASK_STATUS_TODO


