import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCourseById,
  getCourseProgress,
  getModules,
  createModule,
  deleteModule,
  getLessons,
  createLesson,
  deleteLesson,
} from "../api/courses";
import s from "./CourseDetail.module.css";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [course, setCourse]       = useState(null);
  const [modules, setModules]     = useState([]);
  const [lessons, setLessons]     = useState({}); // { moduleId: [...] }
  const [opened, setOpened]       = useState({}); // { moduleId: bool }
  const [progress, setProgress]   = useState(null);
  const [loading, setLoading]     = useState(true);

  // Модалки
  const [modal, setModal]         = useState(null); // null | "module" | "lesson"
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [form, setForm]           = useState({});
  const [saving, setSaving]       = useState(false);

  // Загрузка курса и модулей
  useEffect(() => {
    Promise.all([
      getCourseById(id),
      getModules(id),
      user ? getCourseProgress(id) : Promise.resolve(null),
    ]).then(([courseRes, modulesRes, progressRes]) => {
      setCourse(courseRes.data);
      setModules(modulesRes.data);
      if (progressRes) setProgress(progressRes.data);
    }).finally(() => setLoading(false));
  }, [id, user]);

  // Загрузка уроков модуля при раскрытии
  const toggleModule = async (moduleId) => {
    const isOpen = opened[moduleId];
    setOpened((prev) => ({ ...prev, [moduleId]: !isOpen }));

    if (!isOpen && !lessons[moduleId]) {
      try {
        const res = await getLessons(moduleId);
        setLessons((prev) => ({ ...prev, [moduleId]: res.data }));
      } catch {
        setLessons((prev) => ({ ...prev, [moduleId]: [] }));
      }
    }
  };

  // Создать модуль
  const handleCreateModule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createModule(id, {
        title: form.title,
        order: modules.length,
      });
      setModules((prev) => [...prev, res.data]);
      closeModal();
    } catch { alert("Ошибка при создании модуля"); }
    finally { setSaving(false); }
  };

  // Удалить модуль
  const handleDeleteModule = async (e, moduleId) => {
    e.stopPropagation();
    if (!window.confirm("Удалить модуль и все его уроки?")) return;
    try {
      await deleteModule(moduleId);
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
      setLessons((prev) => { const n = { ...prev }; delete n[moduleId]; return n; });
    } catch { alert("Ошибка при удалении"); }
  };

  // Создать урок
  const handleCreateLesson = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createLesson(activeModuleId, {
        title: form.title,
        content: form.content || "",
        order: (lessons[activeModuleId]?.length ?? 0),
      });
      setLessons((prev) => ({
        ...prev,
        [activeModuleId]: [...(prev[activeModuleId] ?? []), res.data],
      }));
      closeModal();
    } catch { alert("Ошибка при создании урока"); }
    finally { setSaving(false); }
  };

  // Удалить урок
  const handleDeleteLesson = async (e, moduleId, lessonId) => {
    e.stopPropagation();
    if (!window.confirm("Удалить урок?")) return;
    try {
      await deleteLesson(lessonId);
      setLessons((prev) => ({
        ...prev,
        [moduleId]: prev[moduleId].filter((l) => l.id !== lessonId),
      }));
    } catch { alert("Ошибка при удалении"); }
  };

  const openModuleModal = () => { setForm({}); setModal("module"); };
  const openLessonModal = (e, moduleId) => {
    e.stopPropagation();
    setActiveModuleId(moduleId);
    setForm({});
    setModal("lesson");
  };
  const closeModal = () => { setModal(null); setForm({}); setSaving(false); };

  // Считаем статистику
  const totalLessons = Object.values(lessons).reduce((a, b) => a + b.length, 0);
  const percent = progress?.progress ?? 0;
  const completed = progress?.completed_tasks ?? 0;
  const total = progress?.total_tasks ?? 0;

  if (loading) return <div className={s.loading}>Загрузка курса...</div>;
  if (!course)  return <div className={s.loading}>Курс не найден</div>;

  return (
    <div className={s.page}>
      {/* BACK */}
      <button className={s.back} onClick={() => navigate("/courses")}>
        ← Назад к курсам
      </button>

      {/* HEADER */}
      <div className={s.header}>
        <div>
          <div className={s.label}>// курс</div>
          <h1 className={s.title}>{course.title}</h1>
          <p className={s.desc}>{course.description}</p>
        </div>
        {isAdmin && (
          <button className={s.btnAdmin} onClick={openModuleModal}>
            + Добавить модуль
          </button>
        )}
      </div>

      {/* STATS */}
      <div className={s.stats}>
        {[
          { icon: "📚", num: modules.length, lbl: "модулей" },
          { icon: "📖", num: total || "—",   lbl: "задач всего" },
          { icon: "✅", num: completed,       lbl: "выполнено" },
          { icon: "⚡", num: `${percent}%`,   lbl: "прогресс" },
        ].map(({ icon, num, lbl }) => (
          <div key={lbl} className={s.statCard}>
            <span className={s.statIcon}>{icon}</span>
            <div>
              <div className={s.statNum}>{num}</div>
              <div className={s.statLbl}>{lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* PROGRESS BAR */}
      {user && (
        <div className={s.progWrap}>
          <div className={s.progTop}>
            <span className={s.progLbl}>Прогресс курса</span>
            <span className={s.progVal}>{completed} / {total} задач</span>
          </div>
          <div className={s.progTrack}>
            <div
              className={`${s.progFill} ${percent === 100 ? s.progFillDone : ""}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* MODULES */}
      {modules.length === 0 ? (
        <div className={s.empty}>
          <span className={s.emptyIcon}>📭</span>
          {isAdmin ? "Модулей пока нет. Добавь первый!" : "Модули ещё не добавлены"}
        </div>
      ) : (
        <div className={s.modules}>
          {modules.map((mod, i) => {
            const isOpen = !!opened[mod.id];
            const modLessons = lessons[mod.id] ?? [];

            return (
              <div key={mod.id} className={s.mod}>
                {/* Заголовок модуля */}
                <div className={s.modHead} onClick={() => toggleModule(mod.id)}>
                  <span className={`${s.modArrow} ${isOpen ? s.modArrowOpen : ""}`}>▶</span>
                  <span className={s.modNum}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={s.modName}>{mod.title}</span>
                  <div className={s.modMeta}>
                    {isOpen && (
                      <span className={s.modCount}>{modLessons.length} уроков</span>
                    )}
                    {isAdmin && (
                      <button
                        className={s.modDel}
                        onClick={(e) => handleDeleteModule(e, mod.id)}
                        title="Удалить модуль"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Список уроков */}
                {isOpen && (
                  <div className={s.lessons}>
                    {modLessons.length === 0 ? (
                      <div style={{
                        padding: "0.75rem",
                        color: "var(--muted)",
                        fontSize: 12,
                        fontFamily: "IBM Plex Mono, monospace"
                      }}>
                        Уроков пока нет
                      </div>
                    ) : (
                      modLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className={s.lesson}
                          onClick={() => navigate(`/courses/${id}/lessons/${lesson.id}`)}
                        >
                          <div className={s.lessonCheck} />
                          <div className={s.lessonInfo}>
                            <div className={s.lessonName}>{lesson.title}</div>
                            <div className={s.lessonSub}>Порядок: {lesson.order + 1}</div>
                          </div>
                          <span className={s.lessonArrow}>→</span>
                          {isAdmin && (
                            <button
                              className={s.lessonDel}
                              onClick={(e) => handleDeleteLesson(e, mod.id, lesson.id)}
                              title="Удалить урок"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))
                    )}

                    {/* Кнопка добавить урок — только для админа */}
                    {isAdmin && (
                      <button
                        className={s.addLesson}
                        onClick={(e) => openLessonModal(e, mod.id)}
                      >
                        + Добавить урок
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      {modal && (
        <div className={s.overlay} onClick={closeModal}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <button className={s.modalClose} onClick={closeModal}>×</button>

            {modal === "module" && (
              <>
                <div className={s.modalTitle}>Добавить модуль</div>
                <form className={s.form} onSubmit={handleCreateModule}>
                  <div>
                    <label className={s.formLabel}>Название модуля</label>
                    <input
                      className={s.formInput}
                      placeholder="Введение в Python"
                      value={form.title ?? ""}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className={s.formSubmit} disabled={saving}>
                    {saving ? "Создаём..." : "Создать модуль"}
                  </button>
                </form>
              </>
            )}

            {modal === "lesson" && (
              <>
                <div className={s.modalTitle}>Добавить урок</div>
                <form className={s.form} onSubmit={handleCreateLesson}>
                  <div>
                    <label className={s.formLabel}>Название урока</label>
                    <input
                      className={s.formInput}
                      placeholder="Переменные и типы данных"
                      value={form.title ?? ""}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className={s.formLabel}>Контент урока</label>
                    <textarea
  className={s.formTextarea}
  placeholder={`Поддерживается Markdown разметка:

## Заголовок
**жирный**, *курсив*
- список
\`код\`

\`\`\`python
print("Hello!")
\`\`\``}
  value={form.content ?? ""}
  onChange={(e) => setForm({ ...form, content: e.target.value })}
/>
                  </div>
                  <button type="submit" className={s.formSubmit} disabled={saving}>
                    {saving ? "Создаём..." : "Создать урок"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}