from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlmodel import Session

from app.db.session import get_session
from app.schemas.task import TaskCreate, TaskListResponse, TaskRead, TaskStatusFilter, TaskUpdate
from app.services import tasks as tasks_service

router = APIRouter(prefix="/tasks")


@router.get("", response_model=TaskListResponse)
def list_tasks(
    status_filter: TaskStatusFilter = Query(default="all", alias="status"),
    q: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
) -> TaskListResponse:
    items, total = tasks_service.list_tasks(
        session=session,
        status_filter=status_filter,
        q=q,
        limit=limit,
        offset=offset,
    )
    return TaskListResponse(
        items=[TaskRead.model_validate(x, from_attributes=True) for x in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(data: TaskCreate, session: Session = Depends(get_session)) -> TaskRead:
    task = tasks_service.create_task(session=session, data=data)
    return TaskRead.model_validate(task, from_attributes=True)


@router.get("/{task_id}", response_model=TaskRead)
def get_task(task_id: int, session: Session = Depends(get_session)) -> TaskRead:
    task = tasks_service.get_task_or_404(session=session, task_id=task_id)
    return TaskRead.model_validate(task, from_attributes=True)


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(task_id: int, data: TaskUpdate, session: Session = Depends(get_session)) -> TaskRead:
    task = tasks_service.update_task(session=session, task_id=task_id, data=data)
    return TaskRead.model_validate(task, from_attributes=True)


@router.patch("/{task_id}/toggle", response_model=TaskRead)
def toggle_done(task_id: int, session: Session = Depends(get_session)) -> TaskRead:
    task = tasks_service.toggle_task_done(session=session, task_id=task_id)
    return TaskRead.model_validate(task, from_attributes=True)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, session: Session = Depends(get_session)) -> Response:
    tasks_service.delete_task(session=session, task_id=task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


