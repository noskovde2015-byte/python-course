from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper
from api.dependencies import get_current_user
from api.crud.payment_crud import (
    list_packages,
    create_payment,
    get_payment,
    confirm_payment,
    cancel_payment,
    get_payment_history,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/packages")
async def packages():
    return await list_packages()


@router.post("/buy/{package_id}")
async def buy_stars(
    package_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    user=Depends(get_current_user),
):
    try:
        payment, checkout_url = await create_payment(session, user, package_id)
        return {
            "payment_id": payment.id,
            "status": payment.status,
            "checkout_url": checkout_url,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/mock/{payment_id}")
async def mock_checkout(
    payment_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    payment = await get_payment(session, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    return {
        "payment_id": payment.id,
        "package_id": payment.package_id,
        "stars": payment.stars,
        "amount": payment.amount,
        "status": payment.status,
        "confirm_endpoint": f"/api/payments/{payment.id}/confirm",
        "cancel_endpoint": f"/api/payments/{payment.id}/cancel",
    }


@router.post("/{payment_id}/confirm")
async def confirm(
    payment_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    try:
        payment = await confirm_payment(session, payment_id)
        return {
            "payment_id": payment.id,
            "status": payment.status,
            "stars_added": payment.stars,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{payment_id}/cancel")
async def cancel(
    payment_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    try:
        payment = await cancel_payment(session, payment_id)
        return {
            "payment_id": payment.id,
            "status": payment.status,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/history")
async def history(
    session: AsyncSession = Depends(db_helper.session_getter),
    user=Depends(get_current_user),
):
    payments = await get_payment_history(session, user)
    return payments
