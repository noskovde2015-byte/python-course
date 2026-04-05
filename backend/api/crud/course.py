from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import Course
from core.shemas.course_shema import CourseCreate


async def create_course(session: AsyncSession, course_data: CourseCreate):
    course = Course(**course_data.model_dump())
    session.add(course)
    await session.commit()
    await session.refresh(course)
    return course


async def get_courses(session: AsyncSession):
    result = await session.execute(select(Course))
    return result.scalars().all()


async def get_course_by_id(session: AsyncSession, course_id: int):
    return await session.get(Course, course_id)


async def delete_course(session: AsyncSession, course: Course):
    await session.delete(course)
    await session.commit()
