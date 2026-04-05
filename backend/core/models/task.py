from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Text, ForeignKey
from core.models import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .lesson import Lesson


class Task(Base):
    __tablename__ = "tasks"

    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)

    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))

    lesson: Mapped["Lesson"] = relationship(back_populates="tasks")
