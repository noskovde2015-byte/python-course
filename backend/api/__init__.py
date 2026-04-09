from fastapi import APIRouter
from core.config import settings
from api.routers.register_router import router as register_router
from api.routers.login_router import router as login_router
from api.routers.course_router import router as course_router
from api.routers.module_router import router as module_router
from api.routers.lesson_router import router as lesson_router
from api.routers.task_router import router as task_router
from api.routers.stars_router import router as stars_router

router = APIRouter(prefix=settings.prefix.api_prefix)
router.include_router(register_router)
router.include_router(login_router)
router.include_router(course_router)
router.include_router(module_router)
router.include_router(lesson_router)
router.include_router(task_router)
router.include_router(stars_router)
