from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.crud.hint_crud import create_problem_hint, buy_problem_hint
from api.dependencies import get_current_user, get_current_admin
from core.config import settings
from core.models import db_helper

router = APIRouter(prefix=settings.prefix.problem_prefix, tags=["Hints"])


@router.post("/{problem_id}/hints/{hint_id}/buy")
async def create_hint(
    problem_id: int,
    text: str,
    price: int = 50,
    order: int = 1,
    session: AsyncSession = Depends(db_helper.session_getter),
    admin=Depends(get_current_admin),
):
    return await create_problem_hint(
        session=session,
        problem_id=problem_id,
        text=text,
        price=price,
        order=order,
    )


@router.post("/hints/{hint_id}/buy")
async def buy_hint(
    hint_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    user=Depends(get_current_user),
):
    try:
        return await buy_problem_hint(
            session=session,
            user=user,
            hint_id=hint_id,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
