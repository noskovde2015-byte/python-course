from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import Course


async def create_course(session: AsyncSession, title: str, description: str):
    course = Course(title=title, description=description)
    session.add(course)
    await session.commit()
    await session.refresh(course)
    return course


async def get_courses(session: AsyncSession):
    result = await session.execute(select(Course))
    return result.scalars().all()


async def get_course_by_id(session: AsyncSession, course_id: int):
    return await session.get(Course, course_id)
