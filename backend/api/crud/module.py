from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import Module
from core.shemas.module_shema import ModuleCreate


async def create_module(
    session: AsyncSession, module_data: ModuleCreate, course_id: int
):
    module = Module(**module_data.model_dump(), course_id=course_id)
    session.add(module)
    await session.commit()
    await session.refresh(module)
    return module


async def get_modules_by_course(session: AsyncSession, course_id: int):
    result = await session.execute(select(Module).where(Module.course_id == course_id))
    return result.scalars().all()


async def get_module_by_id(session: AsyncSession, module_id: int):
    return await session.get(Module, module_id)


async def delete_module(session: AsyncSession, module_id: int) -> None:
    module = await session.get(Module, module_id)
    if not module:
        raise ValueError(f"Модуль с id {module_id} не найден")

    await session.delete(module)
    await session.commit()
