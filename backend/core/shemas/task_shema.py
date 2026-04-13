from pydantic import BaseModel, ConfigDict


class TaskCreate(BaseModel):
    question: str
    type: str = "quiz"

    answer: str | None = None
    options: list[str] | None = None
    correct_answers: list[str] | None = None
    multiple: bool = False

    model_config = {"extra": "forbid"}


class TaskRead(BaseModel):
    id: int
    question: str
    type: str
    options: list[str] | None = None
    multiple: bool

    model_config = ConfigDict(from_attributes=True)


class TaskSubmit(BaseModel):
    answer: str | list[str]


class TaskSubmitResponse(BaseModel):
    correct: bool
    completed: bool

    model_config = ConfigDict(from_attributes=True)
