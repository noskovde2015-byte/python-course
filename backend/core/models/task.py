from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Text, ForeignKey, String, JSON, Boolean
from core.models import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .lesson import Lesson


class Task(Base):
    __tablename__ = "tasks"

    question: Mapped[str] = mapped_column(Text, nullable=False)

    answer: Mapped[str | None] = mapped_column(Text, nullable=True)

    # варианты ответа
    options: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # правильные ответы
    correct_answers: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    multiple: Mapped[bool] = mapped_column(Boolean, default=False)

    type: Mapped[str] = mapped_column(String(20), default="quiz", nullable=False)

    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))

    lesson: Mapped["Lesson"] = relationship(back_populates="tasks")
