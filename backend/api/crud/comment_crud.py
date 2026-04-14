from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.models import TaskComment


async def create_comment(session: AsyncSession, user, task_id: int, data):
    comment = TaskComment(
        user_id=user.id,
        task_id=task_id,
        text=data.text,
    )
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    return comment


async def get_comments_by_task(session: AsyncSession, task_id: int):
    result = await session.execute(
        select(TaskComment).where(TaskComment.task_id == task_id)
    )
    return result.scalars().all()
