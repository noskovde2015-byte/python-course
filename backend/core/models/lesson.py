from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, Integer, ForeignKey
from core.models import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .task import Task
    from .module import Module


class Lesson(Base):
    __tablename__ = "lessons"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0)

    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"))

    module: Mapped["Module"] = relationship(back_populates="lessons")

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="lesson",
        cascade="all, delete-orphan",
    )
