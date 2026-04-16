from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text
from core.models import Base


class Problem(Base):
    __tablename__ = "problems"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(50))
    solution: Mapped[str] = mapped_column(Text)

    submissions = relationship(
        "ProblemSubmission",
        back_populates="problem",
        cascade="all, delete-orphan",
    )
