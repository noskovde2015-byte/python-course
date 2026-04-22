from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, JSON
from core.models import Base


class Problem(Base):
    __tablename__ = "problems"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(50))
    test_cases: Mapped[list[dict]] = mapped_column(JSON, nullable=False)

    submissions = relationship(
        "ProblemSubmission",
        back_populates="problem",
        cascade="all, delete-orphan",
    )
