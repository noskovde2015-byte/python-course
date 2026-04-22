from pydantic import BaseModel


class ProblemCreate(BaseModel):
    title: str
    description: str
    difficulty: str
    test_cases: list[dict]


class ProblemRead(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str

    class Config:
        from_attributes = True


class SubmissionCreate(BaseModel):
    code: str


class SubmissionResponse(BaseModel):
    correct: bool
    passed: int
    total: int
