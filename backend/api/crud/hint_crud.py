from core.models import ProblemHint, ProblemHintPurchase, StarTransaction
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.models.star_transaction import TransactionType


async def create_problem_hint(
    session: AsyncSession,
    problem_id: int,
    text: str,
    price: int,
    order: int,
):
    hint = ProblemHint(
        problem_id=problem_id,
        text=text,
        price=price,
        order=order,
    )

    session.add(hint)
    await session.commit()
    await session.refresh(hint)

    return hint


async def buy_problem_hint(
    session: AsyncSession,
    user,
    hint_id: int,
):
    hint = await session.get(ProblemHint, hint_id)

    if not hint:
        raise ValueError("Hint not found")

    # уже куплено?
    result = await session.execute(
        select(ProblemHintPurchase).where(
            ProblemHintPurchase.user_id == user.id,
            ProblemHintPurchase.hint_id == hint_id,
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        return {
            "already_bought": True,
            "hint": hint.text,
        }

    # хватает звезд?
    if user.stars < hint.price:
        raise ValueError("Недостаточно звезд")

    # списываем
    user.stars -= hint.price

    session.add(
        StarTransaction(
            user_id=user.id,
            amount=-hint.price,
            type=TransactionType.SPEND,
        )
    )

    # сохраняем покупку
    session.add(
        ProblemHintPurchase(
            user_id=user.id,
            hint_id=hint.id,
        )
    )

    await session.commit()

    return {
        "already_bought": False,
        "hint": hint.text,
    }
