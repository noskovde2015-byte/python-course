from pydantic import BaseModel, ConfigDict


class LessonCreate(BaseModel):
    title: str
    content: str
    order: int = 0


class LessonRead(BaseModel):
    id: int
    title: str
    content: str
    order: int

    model_config = ConfigDict(from_attributes=True)
