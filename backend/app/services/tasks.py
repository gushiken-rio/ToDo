from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlmodel import Session, col, select

from app.models.category import Category
from app.models.task import (
    TASK_STATUS_DONE,
    TASK_STATUS_TODO,
    Task,
)
from app.models.user import User
from app.schemas.task import TaskCreate, TaskStatusFilter, TaskUpdate


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_task(*, session: Session, data: TaskCreate) -> Task:
    user_id, cat_id = _resolve_task_owner_and_category(session=session, data=data)
    task = Task(
        title=data.title,
        description=data.description,
        user_id=user_id,
        cat_id=cat_id,
        status=data.status,
        finish_date=data.finish_date,
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def get_task_or_404(*, session: Session, task_id: int) -> Task:
    task = session.get(Task, task_id)
    if not task or task.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


def list_tasks(
    *,
    session: Session,
    status_filter: TaskStatusFilter = "all",
    q: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[Task], int]:
    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    stmt = select(Task)
    count_stmt = select(func.count()).select_from(Task)
    stmt = stmt.where(col(Task.deleted_at).is_(None))
    count_stmt = count_stmt.where(col(Task.deleted_at).is_(None))

    if status_filter == "done":
        stmt = stmt.where(col(Task.status) == TASK_STATUS_DONE)
        count_stmt = count_stmt.where(col(Task.status) == TASK_STATUS_DONE)
    elif status_filter == "todo":
        stmt = stmt.where(col(Task.status) != TASK_STATUS_DONE)
        count_stmt = count_stmt.where(col(Task.status) != TASK_STATUS_DONE)

    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(col(Task.title).ilike(like))
        count_stmt = count_stmt.where(col(Task.title).ilike(like))

    stmt = stmt.order_by(col(Task.created_at).desc()).limit(limit).offset(offset)

    items = list(session.exec(stmt).all())
    total = int(session.exec(count_stmt).one())
    return items, total


def update_task(*, session: Session, task_id: int, data: TaskUpdate) -> Task:
    task = get_task_or_404(session=session, task_id=task_id)
    if data.title is not None:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.status is not None:
        task.status = data.status
    if data.is_done is not None:
        task.status = TASK_STATUS_DONE if data.is_done else TASK_STATUS_TODO
    if data.cat_id is not None:
        task.cat_id = data.cat_id
    if data.finish_date is not None:
        task.finish_date = data.finish_date
    task.updated_at = utc_now()
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def toggle_task_done(*, session: Session, task_id: int) -> Task:
    task = get_task_or_404(session=session, task_id=task_id)
    task.status = TASK_STATUS_TODO if task.status == TASK_STATUS_DONE else TASK_STATUS_DONE
    task.updated_at = utc_now()
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def delete_task(*, session: Session, task_id: int) -> None:
    task = get_task_or_404(session=session, task_id=task_id)
    task.deleted_at = utc_now()
    task.updated_at = utc_now()
    session.add(task)
    session.commit()


def _resolve_task_owner_and_category(*, session: Session, data: TaskCreate) -> tuple[int, int]:
    user_id = data.user_id
    cat_id = data.cat_id

    if user_id is None:
        default_user = session.exec(
            select(User).where(col(User.deleted_at).is_(None)).order_by(col(User.id).asc()).limit(1)
        ).first()
        if default_user is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active user found")
        user_id = default_user.id

    if cat_id is None:
        default_category = session.exec(
            select(Category).where(col(Category.deleted_at).is_(None)).order_by(col(Category.id).asc()).limit(1)
        ).first()
        if default_category is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active category found")
        cat_id = default_category.id

    assert user_id is not None
    assert cat_id is not None
    return user_id, cat_id


