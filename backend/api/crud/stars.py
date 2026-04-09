from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from core.models.star_transaction import TransactionType
from core.models import User, StarTransaction

DAILY_REWARD = 10


async def claim_daily_reward(user: User, session: AsyncSession):
    now = datetime.now(timezone.utc)

    if user.last_daily_reward:
        if user.last_daily_reward.date() == now.date():
            raise ValueError("Награда уже получена")

    user.stars += DAILY_REWARD
    user.last_daily_reward = now

    transaction = StarTransaction(
        user_id=user.id,
        amount=DAILY_REWARD,
        type=TransactionType.DAILY_REWARD,
    )
    session.add(transaction)
    await session.commit()
    await session.refresh(user)

    return user
