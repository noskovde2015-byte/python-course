from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Integer
from core.models import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .course import Course
    from .lesson import Lesson


class Module(Base):
    __tablename__ = "modules"

    title: Mapped[str] = mapped_column(String(255), nullable=False)

    order: Mapped[int] = mapped_column(Integer, default=0)

    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))

    course: Mapped["Course"] = relationship(back_populates="modules")

    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="module", cascade="all, delete-orphan", order_by="Lesson.order"
    )
