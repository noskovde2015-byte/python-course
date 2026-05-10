from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import Any


class CommentCreate(BaseModel):
    text: str


class CommentRead(BaseModel):
    id: int
    text: str
    user_id: int
    task_id: int
    created_at: datetime
    user_nickname: str | None = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_user(cls, comment):
        return cls(
            id=comment.id,
            text=comment.text,
            user_id=comment.user_id,
            task_id=comment.task_id,
            created_at=comment.created_at,
            user_nickname=comment.user.nickname if comment.user else None,
        )
