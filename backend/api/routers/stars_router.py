from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_user
from core.shemas.UserShema import UserRead
from core.config import settings
from api.crud.stars import claim_daily_reward
from core.models import User, StarTransaction, db_helper


class StarResponse(BaseModel):
    message: str
    stars: int


router = APIRouter(prefix=settings.prefix.stars_prefix, tags=["Stars"])


@router.post("", response_model=StarResponse)
async def claim_daily(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.session_getter),
):
    try:
        updated_user = await claim_daily_reward(user, session)
        return {
            "message": "Reward claimed",
            "stars": updated_user.stars,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
