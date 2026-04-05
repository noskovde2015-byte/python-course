from pydantic import BaseModel, ConfigDict


class CourseCreate(BaseModel):
    title: str
    description: str


class CourseRead(BaseModel):
    id: int
    title: str
    description: str
    model_config = ConfigDict(from_attributes=True)
