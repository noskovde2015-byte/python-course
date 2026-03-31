from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from starlette.status import HTTP_409_CONFLICT, HTTP_201_CREATED

from core.auth import hash_password
from core.models import db_helper, User
from core.config import settings
from core.shemas.UserShema import UserCreate

router = APIRouter(prefix=settings.prefix.register_prefix, tags=["Auth"])


@router.post("", status_code=HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    user = await session.scalar(select(User).where(User.email == user_data.email))

    if user is not None:
        raise HTTPException(
            status_code=HTTP_409_CONFLICT, detail="Email already registered"
        )

    new_user = User(
        email=user_data.email,
        password=hash_password(user_data.password),
        nickname=user_data.nickname,
    )

    try:
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=HTTP_409_CONFLICT, detail="Email already registered"
        )

    return new_user
