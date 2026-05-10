from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import settings
from core.models import db_helper
from api.dependencies import get_current_user
from core.shemas.comment_shema import CommentCreate, CommentRead
from api.crud.comment_crud import create_comment, get_comments_by_task

router = APIRouter(prefix=settings.prefix.comments_prefix, tags=["Comments"])


@router.post("/{task_id}", response_model=CommentRead)
async def add_comment(
    task_id: int,
    data: CommentCreate,
    session: AsyncSession = Depends(db_helper.session_getter),
    user=Depends(get_current_user),
):
    comment = await create_comment(
        session=session, task_id=task_id, data=data, user=user
    )
    return CommentRead.from_orm_with_user(comment)


@router.get("/{task_id}", response_model=list[CommentRead])
async def get_comments(
    task_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    comments = await get_comments_by_task(task_id=task_id, session=session)
    return [CommentRead.from_orm_with_user(c) for c in comments]
