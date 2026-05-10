from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from core.models import TaskComment, User


async def create_comment(session: AsyncSession, user, task_id: int, data):
    comment = TaskComment(
        user_id=user.id,
        task_id=task_id,
        text=data.text,
    )
    session.add(comment)
    await session.commit()

    result = await session.execute(
        select(TaskComment)
        .options(joinedload(TaskComment.user))
        .where(TaskComment.id == comment.id)
    )
    return result.scalar_one()


async def get_comments_by_task(session: AsyncSession, task_id: int):
    result = await session.execute(
        select(TaskComment)
        .options(joinedload(TaskComment.user))
        .where(TaskComment.task_id == task_id)
        .order_by(TaskComment.created_at)
    )
    return result.scalars().all()
