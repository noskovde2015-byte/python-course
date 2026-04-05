from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import Task, Lesson
from core.shemas.task_shema import TaskCreate


async def create_task(
    session: AsyncSession,
    lesson_id: int,
    task_data: TaskCreate,
):
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise ValueError("Lesson not found")

    task = Task(
        **task_data.model_dump(),
        lesson_id=lesson_id,
    )

    try:
        session.add(task)
        await session.commit()
        await session.refresh(task)
        return task
    except:
        await session.rollback()
        raise


async def get_tasks_by_lesson(session: AsyncSession, lesson_id: int):
    result = await session.execute(select(Task).where(Task.lesson_id == lesson_id))
    return result.scalars().all()


async def delete_task(session: AsyncSession, task: Task):
    await session.delete(task)
    await session.commit()
