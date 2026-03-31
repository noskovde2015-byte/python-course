import datetime

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from core.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    nickname: str = Field(max_length=50)


class UserCreate(UserBase):
    password: str


class UserAuth(BaseModel):
    email: EmailStr
    password: str


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool
    created_at: datetime.datetime
    role: UserRole
