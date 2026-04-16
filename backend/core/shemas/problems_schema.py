from pydantic import BaseModel, ConfigDict


class ProblemCreate(BaseModel):
    title: str
    description: str
    difficulty: str
    solution: str


class ProblemRead(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    solution: str

    model_config = ConfigDict(from_attributes=True)


class SubmissionCreate(BaseModel):
    code: str


class SubmissionResponse(BaseModel):
    correct: bool
    message: str
