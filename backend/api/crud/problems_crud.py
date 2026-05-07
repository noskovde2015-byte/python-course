from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.models import Problem, ProblemSubmission, User, ProblemHintPurchase
from core.shemas.problems_schema import ProblemCreate
from sqlalchemy import select, func, distinct
from utils.judge0 import run_code


async def create_problem(session: AsyncSession, data: ProblemCreate):
    problem = Problem(**data.model_dump())
    session.add(problem)
    await session.commit()
    await session.refresh(problem)
    return problem


async def get_problem_by_difficulty(session: AsyncSession, difficulty: str):
    difficulty = difficulty.strip().lower()
    result = await session.execute(
        select(Problem).where(Problem.difficulty == difficulty).order_by(Problem.id)
    )
    return result.scalars().all()


async def get_problem(session: AsyncSession):
    result = await session.execute(select(Problem))
    return result.scalars().all()


async def get_problem_by_id(
    session: AsyncSession,
    user,
    problem_id: int,
):
    # 1. Грузим problem + hints БЕЗ lazy loading
    result = await session.execute(
        select(Problem)
        .options(selectinload(Problem.hints))  # 👈 ВАЖНО
        .where(Problem.id == problem_id)
    )

    problem = result.scalar_one_or_none()

    if not problem:
        raise ValueError("Problem not found")

    # 2. Получаем купленные hints одним запросом
    result = await session.execute(
        select(ProblemHintPurchase.hint_id).where(
            ProblemHintPurchase.user_id == user.id
        )
    )

    purchased_hint_ids = {row[0] for row in result.all()}

    # 3. Формируем ответ
    return {
        "id": problem.id,
        "title": problem.title,
        "description": problem.description,
        "difficulty": problem.difficulty,
        "hints": [
            {
                "id": hint.id,
                "price": hint.price,
                "order": hint.order,
                "is_bought": hint.id in purchased_hint_ids,
                "text": (hint.text if hint.id in purchased_hint_ids else None),
            }
            for hint in sorted(problem.hints, key=lambda h: h.order)
        ],
    }


async def delete_problem(session: AsyncSession, problem_id: int):
    problem = await session.get(Problem, problem_id)

    if not problem:
        return False

    await session.delete(problem)
    await session.commit()
    return True


async def submit_solution(user, problem_id: int, code: str, session):
    problem = await session.get(Problem, problem_id)

    if not problem:
        raise ValueError("Problem not found")

    passed = 0
    total = len(problem.test_cases)

    for test in problem.test_cases:
        output = await run_code(code, stdin=test["input"])

        if output.strip() == test["output"].strip():
            passed += 1

    is_correct = passed == total

    submission = ProblemSubmission(
        user_id=user.id,
        problem_id=problem.id,
        code=code,
        is_correct=is_correct,
    )

    session.add(submission)
    await session.commit()

    return {"correct": is_correct, "passed": passed, "total": total}


async def get_leaderboard(session: AsyncSession):
    result = await session.execute(
        select(
            User.id,
            User.nickname,
            func.count(distinct(ProblemSubmission.problem_id)).label("solved"),
        )
        .outerjoin(ProblemSubmission, ProblemSubmission.user_id == User.id)
        .where(ProblemSubmission.is_correct == True)
        .group_by(User.id, User.nickname)
        .order_by(func.count(distinct(ProblemSubmission.problem_id)).desc())
    )

    return result.all()
