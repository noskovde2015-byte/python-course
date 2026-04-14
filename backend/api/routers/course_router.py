from distlib.util import Progress
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import db_helper
from core.config import settings
from core.shemas.course_shema import CourseCreate, CourseRead
from api.crud.course import create_course, get_courses, get_course_by_id, delete_course
from api.crud.progress_crud import get_course_progress
from api.dependencies import get_current_admin, get_current_user

router = APIRouter(prefix=settings.prefix.course_prefix, tags=["Courses"])


@router.post("", response_model=CourseRead)
async def create_course_router(
    course_data: CourseCreate,
    session: AsyncSession = Depends(db_helper.session_getter),
    admin=Depends(get_current_admin),
):
    return await create_course(
        session=session,
        course_data=course_data,
    )


@router.get("", response_model=list[CourseRead])
async def get_courses_router(session: AsyncSession = Depends(db_helper.session_getter)):
    return await get_courses(session=session)


@router.get("/{course_id}", response_model=CourseRead)
async def get_course_by_id_router(
    course_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    course = await get_course_by_id(course_id=course_id, session=session)
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")
    return course


@router.delete("/{course_id}")
async def delete_course_router(
    course_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    admin=Depends(get_current_admin),
):
    course = await get_course_by_id(session=session, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")

    await delete_course(
        session=session,
        course=course,
    )
    return {"Message": "Курс удален"}


@router.get("/{course_id}/progress")
async def get_course_progress_router(
    course_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    user=Depends(get_current_user),
):
    return await get_course_progress(
        course_id=course_id,
        session=session,
        user=user,
    )
