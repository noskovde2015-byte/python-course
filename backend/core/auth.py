from datetime import timedelta, datetime, timezone
import secrets
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select, Result
from sqlalchemy.ext.asyncio import AsyncSession
import hashlib
from core.config import settings
from core.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.auth.ACCESS_TOKEN_EXPIRE
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode, settings.auth.SECRET_KEY, algorithm=settings.auth.ALGORITHM
    )


def create_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def hash_refresh_token(refresh_token: str) -> str:
    return hashlib.sha256(refresh_token.encode()).hexdigest()


async def authenticate_user(email: str, password: str, session: AsyncSession):
    stmt = select(User).where(User.email == email)
    result: Result = await session.execute(stmt)
    user = result.scalars().one_or_none()

    if not user or not user.password or not verify_password(password, user.password):
        return None
    return user
