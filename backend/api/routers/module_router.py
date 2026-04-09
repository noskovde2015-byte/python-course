from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.dependencies import get_current_admin
from core.config import settings
from core.shemas.module_shema import ModuleCreate, ModuleRead
from core.models import db_helper
from api.crud.module import (
    create_module,
    get_module_by_id,
    get_modules_by_course,
    delete_module,
)

router = APIRouter(prefix=settings.prefix.module_prefix, tags=["Modules"])


@router.post("/courses/{course_id}/modules", response_model=ModuleRead)
async def create_module_router(
    course_id: int,
    module_data: ModuleCreate,
    session: AsyncSession = Depends(db_helper.session_getter),
    admin=Depends(get_current_admin),
):
    return await create_module(
        course_id=course_id, module_data=module_data, session=session
    )


@router.get("/course/{course_id}", response_model=list[ModuleRead])
async def get_modules_router(
    course_id: int, session: AsyncSession = Depends(db_helper.session_getter)
):
    return await get_modules_by_course(session=session, course_id=course_id)


@router.delete("/{module_id}")
async def delete_module_route(
    module_id: int,
    session: AsyncSession = Depends(db_helper.session_getter),
    admin=Depends(get_current_admin),
):
    module = await get_module_by_id(session=session, module_id=module_id)

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Модуль не найден",
        )
    await delete_module(module=module, session=session)
