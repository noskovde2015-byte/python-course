from sqlalchemy import select, func
from core.models import Task, Lesson, Module, UserTaskProgress


async def get_course_progress(session, user, course_id: int):
    total_stmt = (
        select(func.count(Task.id))
        .join(Lesson, Task.lesson_id == Lesson.id)
        .join(Module, Module.id == Lesson.module_id)
        .where(Module.course_id == course_id)
    )

    total_tasks = await session.scalar(total_stmt)

    completed_stmt = (
        select(func.count(UserTaskProgress.id))
        .join(Task, Task.id == UserTaskProgress.task_id)
        .join(Lesson, Task.lesson_id == Lesson.id)
        .join(Module, Module.id == Lesson.module_id)
        .where(
            Module.course_id == course_id,
            UserTaskProgress.user_id == user.id,
            UserTaskProgress.is_completed == True,
        )
    )
    completed_tasks = await session.scalar(completed_stmt)

    if total_tasks == 0:
        progress = 0
    else:
        progress = int((completed_tasks / total_tasks) * 100)

    return {
        "progress": progress,
        "completed_tasks": completed_tasks,
        "total_tasks": total_tasks,
    }
