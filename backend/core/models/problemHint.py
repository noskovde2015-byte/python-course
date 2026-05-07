from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.models import Base


class ProblemHint(Base):
    __tablename__ = "problem_hints"

    problem_id: Mapped[int] = mapped_column(
        ForeignKey("problems.id", ondelete="CASCADE")
    )

    text: Mapped[str] = mapped_column(Text)
    price: Mapped[int] = mapped_column(Integer, default=50)

    order: Mapped[int] = mapped_column(Integer, default=1)  # порядок подсказки

    problem = relationship("Problem", back_populates="hints")
