from datetime import datetime, timezone

from fastapi import Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.status import (
    HTTP_409_CONFLICT,
    HTTP_401_UNAUTHORIZED,
    HTTP_404_NOT_FOUND,
    HTTP_403_FORBIDDEN,
)
from jose import jwt, JWTError
from core.models import db_helper, User
from core.config import settings
from core.models.user import UserRole


async def get_current_user(
    request: Request,
    session: AsyncSession = Depends(db_helper.session_getter),
) -> User:
    token = request.cookies.get("user_access_token")

    if not token:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Токен не найден",
        )

    try:
        payload = jwt.decode(
            token,
            settings.auth.SECRET_KEY,
            algorithms=[settings.auth.ALGORITHM],
        )

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Неверный формат токена",
            )

        user = await session.get(User, int(user_id))

        if not user:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="Пользователь не найден",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=HTTP_403_FORBIDDEN,
                detail="Пользователь заблокирован",
            )

        return user

    except JWTError:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Неверный токен",
        )


async def get_current_admin(user: User = Depends(get_current_user)):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Недостаточно прав")
    return user
