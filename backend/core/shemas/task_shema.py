from pydantic import BaseModel, ConfigDict


class TaskCreate(BaseModel):
    question: str
    answer: str
    type: str = "quiz"


class TaskRead(BaseModel):
    id: int
    question: str
    type: str

    model_config = ConfigDict(from_attributes=True)


class TaskSubmit(BaseModel):
    answer: str


class TaskSubmitResponse(BaseModel):
    correct: bool
    completed: bool

    model_config = ConfigDict(from_attributes=True)
