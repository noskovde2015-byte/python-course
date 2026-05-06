from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import User, Payment, StarTransaction
from core.models.payment import PaymentStatus
from core.shemas.payment_schema import PaymentPackageRead
from api.crud.payment_packages import PACKAGES
from core.models.star_transaction import TransactionType


async def list_packages():
    return [
        {
            "id": package_id,
            "title": data["title"],
            "stars": data["stars"],
            "amount": data["amount"],
        }
        for package_id, data in PACKAGES.items()
    ]


async def create_payment(session: AsyncSession, user: User, package_id: int):
    package = PACKAGES.get(package_id)
    if not package:
        raise ValueError("Package not found")

    payment = Payment(
        user_id=user.id,
        package_id=package_id,
        stars=package["stars"],
        amount=package["amount"],
        currency="RUB",
        status=PaymentStatus.PENDING.value,
    )

    session.add(payment)
    await session.commit()
    await session.refresh(payment)

    checkout_url = f"/api/payments/mock/{payment.id}"

    return payment, checkout_url


async def get_payment(session: AsyncSession, payment_id: int):
    result = await session.execute(select(Payment).where(Payment.id == payment_id))
    return result.scalar_one_or_none()


async def confirm_payment(session: AsyncSession, payment_id: int):
    payment = await get_payment(session, payment_id)
    if not payment:
        raise ValueError("Payment not found")

    if payment.status == PaymentStatus.PAID.value:
        return payment

    if payment.status == PaymentStatus.CANCELED.value:
        raise ValueError("Payment is canceled")

    result = await session.execute(select(User).where(User.id == payment.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")

    payment.status = PaymentStatus.PAID.value
    payment.paid_at = datetime.now(timezone.utc)

    user.stars += payment.stars

    session.add(
        StarTransaction(
            user_id=user.id,
            amount=payment.stars,
            type=TransactionType.PURCHASE,
        )
    )

    await session.commit()
    await session.refresh(payment)
    return payment


async def cancel_payment(session: AsyncSession, payment_id: int):
    payment = await get_payment(session, payment_id)
    if not payment:
        raise ValueError("Payment not found")

    if payment.status == PaymentStatus.PAID.value:
        raise ValueError("Payment already paid")

    payment.status = PaymentStatus.CANCELED.value
    payment.canceled_at = datetime.now(timezone.utc)

    await session.commit()
    await session.refresh(payment)
    return payment


async def get_payment_history(session: AsyncSession, user: User):
    result = await session.execute(
        select(Payment)
        .where(Payment.user_id == user.id)
        .order_by(Payment.created_at.desc())
    )
    return result.scalars().all()
