from fastapi import APIRouter
from core.config import settings
from api.routers.register_router import router as register_router
from api.routers.login_router import router as login_router

router = APIRouter(prefix=settings.prefix.api_prefix)
router.include_router(register_router)
router.include_router(login_router)
