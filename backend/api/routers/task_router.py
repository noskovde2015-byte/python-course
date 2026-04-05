from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import settings
from core.models import db_helper
from api.dependencies import get_current_admin
from core.shemas.task_shema import TaskCreate, TaskRead
from api.crud.task import create_task, get_tasks_by_lesson, delete_task

router = APIRouter(prefix=settings.prefix.task_prefix, tags=["Tasks"])


@router.post("/lessons/{lesson_id}/tasks", response_model=TaskRead)
async def create_task_route(
    lesson_id: int,
    data: TaskCreate,
    session: AsyncSession = Depends(db_helper.session_getter),
    admin=Depends(get_current_admin),
):
    try:
        return await create_task(session, lesson_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/lesson/{lesson_id}", response_model=list[TaskRead])
async def get_tasks_route(
    lesson_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await get_tasks_by_lesson(session, lesson_id)


@router.delete("/{task_id}")
async def delete_task_route(
    task_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    admin=Depends(get_current_admin),
):
    await delete_task(session, task_id)
    return {"message": "Task deleted"}
