from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import Lesson
from core.shemas.lesson_shema import LessonCreate
from core.models import Module


async def create_lesson(
    session: AsyncSession, lesson_data: LessonCreate, module_id: int
):
    module = await session.get(Module, module_id)
    if not module:
        raise ValueError("Модуль не найден")

    lesson = Lesson(
        **lesson_data.model_dump(),
        module_id=module_id,
    )

    try:
        session.add(lesson)
        await session.commit()
        await session.refresh(lesson)
        return lesson
    except:
        await session.rollback()
        raise


async def get_lessons_by_module(session: AsyncSession, module_id: int):
    result = await session.execute(select(Lesson).where(Lesson.module_id == module_id))
    return result.scalars().all()


async def get_lesson_by_id(session: AsyncSession, lesson_id: int):
    return await session.get(Lesson, lesson_id)


async def delete_lesson(session: AsyncSession, lesson_id: int) -> None:
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise ValueError(f"Урок с id {lesson_id} не найден")

    await session.delete(lesson)
    await session.commit()
