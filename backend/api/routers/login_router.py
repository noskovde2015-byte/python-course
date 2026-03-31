from fastapi import APIRouter, Depends, Response, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from starlette import status
from datetime import timedelta, datetime, timezone

from core.models import db_helper, User, RefreshToken
from core.config import settings
from core.shemas.UserShema import UserAuth
from core.auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    hash_refresh_token,
)

router = APIRouter(prefix=settings.prefix.login_prefix, tags=["Auth"])


# LOGIN
@router.post("")
async def login(
    user_data: UserAuth,
    response: Response,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    user = await authenticate_user(
        email=user_data.email,
        password=user_data.password,
        session=session,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Access token
    access_token = create_access_token({"sub": str(user.id)})

    # Refresh token
    refresh_token = create_refresh_token()
    refresh_hash = hash_refresh_token(refresh_token)

    refresh_expires = datetime.now(timezone.utc) + timedelta(
        days=settings.auth.REFRESH_TOKEN_EXPIRE
    )

    # удаляем старые токены пользователя
    await session.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))

    db_refresh = RefreshToken(
        token_hash=refresh_hash,
        user_id=user.id,
        expires_at=refresh_expires,
    )

    try:
        session.add(db_refresh)
        await session.commit()
    except:
        await session.rollback()
        raise

    # Cookies
    response.set_cookie(
        key="user_access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
    )
    response.set_cookie(
        key="user_refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
    )

    return {"message": "Login successful"}


@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    refresh_token = request.cookies.get("user_refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token",
        )

    hashed = hash_refresh_token(refresh_token)

    stmt = select(RefreshToken).where(RefreshToken.token_hash == hashed)
    result = await session.execute(stmt)
    db_token = result.scalars().one_or_none()

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    user_id = db_token.user_id

    # удаляем старый токен
    await session.delete(db_token)
    await session.commit()

    # создаем новый refresh
    new_refresh = create_refresh_token()
    new_hash = hash_refresh_token(new_refresh)

    new_db_token = RefreshToken(
        token_hash=new_hash,
        user_id=user_id,
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=settings.auth.REFRESH_TOKEN_EXPIRE),
    )

    try:
        session.add(new_db_token)
        await session.commit()
    except:
        await session.rollback()
        raise

    # новый access
    new_access_token = create_access_token({"sub": str(user_id)})

    response.set_cookie(
        key="user_access_token",
        value=new_access_token,
        httponly=True,
        samesite="lax",
    )
    response.set_cookie(
        key="user_refresh_token",
        value=new_refresh,
        httponly=True,
        samesite="lax",
    )

    return {"message": "Token refreshed"}


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(db_helper.session_getter),
):
    refresh_token = request.cookies.get("user_refresh_token")

    if refresh_token:
        hashed = hash_refresh_token(refresh_token)

        stmt = select(RefreshToken).where(RefreshToken.token_hash == hashed)
        result = await session.execute(stmt)
        db_token = result.scalars().one_or_none()

        if db_token:
            await session.delete(db_token)
            await session.commit()

    response.delete_cookie("user_access_token")
    response.delete_cookie("user_refresh_token")

    return {"message": "Logged out"}
