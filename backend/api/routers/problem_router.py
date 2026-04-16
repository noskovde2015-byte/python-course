from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import db_helper
from api.dependencies import get_current_user, get_current_admin
from core.config import settings
from core.config import settings
from api.crud.problems_crud import create_problem, get_problem, submit_solution
from core.shemas.problems_schema import (
    ProblemCreate,
    ProblemRead,
    SubmissionCreate,
    SubmissionResponse,
)

router = APIRouter(prefix=settings.prefix.problem_prefix, tags=["Problems"])


@router.post("")
async def create_problem_router(
    data: ProblemCreate,
    session: AsyncSession = Depends(db_helper.session_getter),
    admin=Depends(get_current_admin),
):
    return await create_problem(data=data, session=session)


@router.get("", response_model=list[ProblemRead])
async def get_problems_router(
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await get_problem(session=session)


@router.post("/{problem_id}/submit", response_model=SubmissionResponse)
async def submit_problem(
    problem_id: int,
    data: SubmissionCreate,
    session: AsyncSession = Depends(db_helper.session_getter),
    user=Depends(get_current_user),
):
    try:
        return await submit_solution(
            user=user, problem_id=problem_id, code=data.code, session=session
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
