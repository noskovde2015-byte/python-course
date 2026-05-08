from fastapi import APIRouter, Depends
from api.dependencies import get_current_user
from core.shemas.UserShema import UserRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
async def get_me(user=Depends(get_current_user)):
    return user
