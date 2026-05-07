from datetime import datetime

from sqlalchemy import ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from core.models import Base


class ProblemHintPurchase(Base):
    __tablename__ = "problem_hint_purchases"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    hint_id: Mapped[int] = mapped_column(
        ForeignKey("problem_hints.id", ondelete="CASCADE")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
