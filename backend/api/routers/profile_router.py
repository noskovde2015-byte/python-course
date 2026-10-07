from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct
from datetime import datetime, timezone

from api.dependencies import get_current_user
from core.models import (
    db_helper,
    User,
    UserTaskProgress,
    Task,
    Lesson,
    Module,
    Payment,
    StarTransaction,
)

from core.models import Problem
from core.models import ProblemSubmission

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("/me")
async def get_profile(
    session: AsyncSession = Depends(db_helper.session_getter),
    user: User = Depends(get_current_user),
):
    # Решённые задачи LeetCode
    solved_result = await session.execute(
        select(
            ProblemSubmission.problem_id,
            Problem.title,
            Problem.difficulty,
            func.max(ProblemSubmission.created_at).label("solved_at"),
        )
        .join(Problem, Problem.id == ProblemSubmission.problem_id)
        .where(
            ProblemSubmission.user_id == user.id,
            ProblemSubmission.is_correct == True,
        )
        .group_by(ProblemSubmission.problem_id, Problem.title, Problem.difficulty)
        .order_by(func.max(ProblemSubmission.created_at).desc())
    )
    solved_problems = [
        {
            "id": row[0],
            "title": row[1],
            "difficulty": row[2],
            "solved_at": row[3].isoformat() if row[3] else None,
        }
        for row in solved_result.all()
    ]

    # Выполненные задачи курсов
    completed_tasks_result = await session.execute(
        select(func.count(UserTaskProgress.id)).where(
            UserTaskProgress.user_id == user.id,
            UserTaskProgress.is_completed == True,
        )
    )
    completed_tasks = completed_tasks_result.scalar() or 0

    # История звёзд
    stars_result = await session.execute(
        select(StarTransaction)
        .where(StarTransaction.user_id == user.id)
        .order_by(StarTransaction.created_at.desc())
        .limit(10)
    )
    stars_history = [
        {
            "type": t.type.value,
            "amount": t.amount,
            "created_at": t.created_at.isoformat(),
        }
        for t in stars_result.scalars().all()
    ]

    # Активность — кол-во решений по дням за последние 6 месяцев
    activity_result = await session.execute(
        select(
            func.date(ProblemSubmission.created_at).label("day"),
            func.count(ProblemSubmission.id).label("count"),
        )
        .where(ProblemSubmission.user_id == user.id)
        .group_by(func.date(ProblemSubmission.created_at))
        .order_by(func.date(ProblemSubmission.created_at))
    )
    activity = {str(row[0]): row[1] for row in activity_result.all()}

    # Место в рейтинге
    rank_result = await session.execute(
        select(
            User.id,
            func.count(distinct(ProblemSubmission.problem_id)).label("solved"),
        )
        .outerjoin(
            ProblemSubmission,
            (ProblemSubmission.user_id == User.id)
            & (ProblemSubmission.is_correct == True),
        )
        .group_by(User.id)
        .order_by(func.count(distinct(ProblemSubmission.problem_id)).desc())
    )
    all_ranks = rank_result.all()
    rank = next((i + 1 for i, row in enumerate(all_ranks) if row[0] == user.id), None)

    return {
        "id": user.id,
        "nickname": user.nickname,
        "email": user.email,
        "role": user.role.value,
        "stars": user.stars,
        "created_at": user.created_at.isoformat(),
        "solved_problems": solved_problems,
        "solved_problems_count": len(solved_problems),
        "completed_tasks": completed_tasks,
        "stars_history": stars_history,
        "activity": activity,
        "rank": rank,
    }
