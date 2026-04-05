from pydantic import BaseModel, ConfigDict


class TaskCreate(BaseModel):
    question: str
    answer: str


class TaskRead(BaseModel):
    id: int
    question: str
    answer: str

    model_config = ConfigDict(from_attributes=True)
