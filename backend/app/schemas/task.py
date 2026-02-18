from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


TaskStatusFilter = Literal["all", "done", "todo"]
TaskProgressStatus = Literal[0, 1]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=4000)
    user_id: Optional[int] = None
    cat_id: Optional[int] = None
    status: TaskProgressStatus = 0
    finish_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=4000)
    is_done: Optional[bool] = None
    status: Optional[TaskProgressStatus] = None
    cat_id: Optional[int] = None
    finish_date: Optional[datetime] = None


class TaskRead(BaseModel):
    id: int
    user_id: int
    cat_id: int
    title: str
    description: Optional[str]
    status: TaskProgressStatus
    finish_date: Optional[datetime]
    is_done: bool
    created_at: datetime
    updated_at: datetime


class TaskListResponse(BaseModel):
    items: list[TaskRead]
    total: int
    limit: int
    offset: int


