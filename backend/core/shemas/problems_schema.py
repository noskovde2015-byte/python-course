from pydantic import BaseModel


class ProblemCreate(BaseModel):
    title: str
    description: str
    difficulty: str
    input_data: str
    expected_output: str


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
    output: str
