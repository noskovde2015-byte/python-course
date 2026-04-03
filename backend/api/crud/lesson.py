from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import Lesson


async def create_lesson(
    session: AsyncSession,
    title: str,
    content: str,
    module_id: int,
    order: int = 0,
):
    lesson = Lesson(
        title=title,
        content=content,
        module_id=module_id,
        order=order,
    )
    session.add(lesson)
    await session.commit()
    await session.refresh(lesson)
    return lesson


async def get_lessons_by_module(session: AsyncSession, module_id: int):
    result = await session.execute(select(Lesson).where(Lesson.module_id == module_id))
    return result.scalars().all()


async def get_lesson_by_id(session: AsyncSession, lesson_id: int):
    return await session.get(Lesson, lesson_id)


async def delete_lesson(session: AsyncSession, lesson: Lesson):
    await session.delete(lesson)
    await session.commit()
