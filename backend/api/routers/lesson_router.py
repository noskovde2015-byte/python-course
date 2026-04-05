from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import db_helper
from core.config import settings
from core.shemas.lesson_shema import LessonCreate, LessonRead
from api.crud.lesson import (
    create_lesson,
    get_lesson_by_id,
    get_lessons_by_module,
    delete_lesson,
)
from api.dependencies import get_current_admin

router = APIRouter(prefix=settings.prefix.lesson_prefix, tags=["Lessons"])


@router.post("/modules/{module_id}/lessons", response_model=LessonRead)
async def create_lesson_route(
    module_id: int,
    data: LessonCreate,
    session: AsyncSession = Depends(db_helper.session_getter),
    admin=Depends(get_current_admin),
):
    try:
        return await create_lesson(
            module_id=module_id, lesson_data=data, session=session
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/module/{module_id}", response_model=list[LessonRead])
async def get_lessons_route(
    module_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await get_lessons_by_module(session, module_id)


@router.delete("/{lesson_id}")
async def delete_lesson_route(
    lesson_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    admin=Depends(get_current_admin),
):
    lesson = await get_lesson_by_id(lesson_id=lesson_id, session=session)
    if not lesson:
        raise HTTPException(status_code=404, detail="Урок не найден")
    await delete_lesson(lesson=lesson, session=session)
