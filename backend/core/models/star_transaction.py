from datetime import datetime
from enum import Enum
from core.models import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Integer, DateTime, func


class TransactionType(str, Enum):
    DAILY_REWARD = "daily_reward"
    PURCHASE = "purchase"
    SPEND = "spend"


class StarTransaction(Base):
    __tablename__ = "star_transactions"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    amount: Mapped[int] = mapped_column(Integer)
    type: Mapped[TransactionType] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    user = relationship("User", back_populates="transactions")
