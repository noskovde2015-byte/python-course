from pydantic import BaseModel, ConfigDict


class ModuleCreate(BaseModel):
    title: str
    order: int = 0


class ModuleRead(BaseModel):
    id: int
    title: str
    order: int

    model_config = ConfigDict(from_attributes=True)
