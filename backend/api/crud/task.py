from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import Task


async def create_task(
    session: AsyncSession,
    question: str,
    answer: str,
    lesson_id: int,
):
    task = Task(
        question=question,
        answer=answer,
        lesson_id=lesson_id,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def get_tasks_by_lesson(session: AsyncSession, lesson_id: int):
    result = await session.execute(select(Task).where(Task.lesson_id == lesson_id))
    return result.scalars().all()


async def delete_task(session: AsyncSession, task: Task):
    await session.delete(task)
    await session.commit()
