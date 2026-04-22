from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import Task, Lesson, UserTaskProgress
from core.shemas.task_shema import TaskCreate
from datetime import datetime
from utils.judge0 import run_code


async def create_task(
    session: AsyncSession,
    lesson_id: int,
    task_data: TaskCreate,
):
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise ValueError("Lesson not found")

    task = Task(
        **task_data.model_dump(),
        lesson_id=lesson_id,
    )

    try:
        session.add(task)
        await session.commit()
        await session.refresh(task)
        return task
    except:
        await session.rollback()
        raise


async def get_tasks_by_lesson(session: AsyncSession, lesson_id: int):
    result = await session.execute(select(Task).where(Task.lesson_id == lesson_id))
    return result.scalars().all()


async def delete_task(session: AsyncSession, task_id: int) -> bool:
    task = await session.get(Task, task_id)
    if not task:
        return False

    await session.delete(task)
    await session.commit()
    return True


async def submit_task_answer(
    session: AsyncSession,
    user,
    task_id: int,
    answer: str,
):
    task = await session.get(Task, task_id)

    if not task:
        raise ValueError("Task not found")

    is_correct = False

    if task.type == "quiz":
        is_correct = task.answer.strip().lower() == str(answer).strip().lower()
    elif task.type == "mcq":
        if not isinstance(answer, list):
            answer = [answer]
        is_correct = sorted(answer) == sorted(task.correct_answers or [])
    elif task.type == "code":
        if not task.test_cases:
            raise ValueError("No test cases found")

        all_passed = True

        for test in task.test_cases:
            output = await run_code(
                code=answer,
                stdin=test["input"],
            )
            if output.strip() != test["output"].strip():
                all_passed = False
                break

        is_correct = all_passed
    # ищем прогресс пользователя
    result = await session.execute(
        select(UserTaskProgress).where(
            UserTaskProgress.user_id == user.id,
            UserTaskProgress.task_id == task_id,
        )
    )
    progress = result.scalar_one_or_none()

    # если нет записи — создаём
    if not progress:
        progress = UserTaskProgress(
            user_id=user.id,
            task_id=task_id,
            is_completed=False,
            completed_at=None,
        )
        session.add(progress)

    # если ответ правильный и ещё не выполнено
    if is_correct and not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = datetime.utcnow()

    await session.commit()

    return {
        "correct": is_correct,
        "completed": progress.is_completed,
    }
