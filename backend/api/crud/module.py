from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import Module


async def create_module(
    session: AsyncSession, title: str, course_id: int, order: int = 0
):
    module = Module(title=title, course_id=course_id, order=order)
    session.add(module)
    await session.commit()
    await session.refresh(module)
    return module


async def get_modules_by_course(session: AsyncSession, course_id: int):
    result = await session.execute(select(Module).where(Module.course_id == course_id))
    return result.scalars().all()


async def get_module_by_id(session: AsyncSession, module_id: int):
    return await session.get(Module, module_id)


async def delete_module(session: AsyncSession, module: Module):
    await session.delete(module)
    await session.commit()
