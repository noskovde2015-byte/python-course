from pydantic import BaseModel, ConfigDict
from datetime import datetime


class CommentCreate(BaseModel):
    text: str


class CommentRead(BaseModel):
    id: int
    text: str
    user_id: int
    task_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
