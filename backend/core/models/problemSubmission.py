from sqlalchemy import ForeignKey, Boolean, DateTime, func, Text
from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class ProblemSubmission(Base):
    __tablename__ = "problem_submissions"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    problem_id: Mapped[int] = mapped_column(
        ForeignKey("problems.id", ondelete="CASCADE")
    )

    code: Mapped[str] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    problem = relationship("Problem", back_populates="submissions")
