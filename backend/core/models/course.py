from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from core.models import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .module import Module


class Course(Base):
    __tablename__ = "courses"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)

    modules: Mapped[list["Module"]] = relationship(
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Module.order",
    )
