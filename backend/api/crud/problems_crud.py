from sqlalchemy.ext.asyncio import AsyncSession
from core.models import Problem, ProblemSubmission
from core.shemas.problems_schema import ProblemCreate
from sqlalchemy import select
from utils.judge0 import run_code


async def create_problem(session: AsyncSession, data: ProblemCreate):
    problem = Problem(**data.model_dump())
    session.add(problem)
    await session.commit()
    await session.refresh(problem)
    return problem


async def get_problem(session: AsyncSession):
    result = await session.execute(select(Problem))
    return result.scalars().all()


async def submit_solution(user, problem_id: int, code: str, session: AsyncSession):
    problem = await session.get(Problem, problem_id)
    if not problem:
        raise ValueError("Problem not found")

    # 🔥 запускаем код
    output = await run_code(code, stdin=problem.input_data)
    # 🔥 проверяем
    is_correct = output.strip() == problem.expected_output.strip()
    submission = ProblemSubmission(
        user_id=user.id,
        problem_id=problem.id,
        code=code,
        is_correct=is_correct,
    )
    session.add(submission)
    await session.commit()
    return {
        "correct": is_correct,
        "output": output,
    }
