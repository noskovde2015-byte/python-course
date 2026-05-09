import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCourses,
  getCourseProgress,
  createCourse,
  deleteCourse,
} from "../api/courses";
import s from "./Courses.module.css";

// Иконки и цвета для баннеров — берём по индексу
const BANNERS = [
  { emoji: "🐍", bg: "linear-gradient(135deg,#1a1a2e,#16213e)" },
  { emoji: "🗄️", bg: "linear-gradient(135deg,#0d1f0d,#0a2a1a)" },
  { emoji: "🐳", bg: "linear-gradient(135deg,#001a2e,#002a4a)" },
  { emoji: "⚡", bg: "linear-gradient(135deg,#1a001a,#2a0a2a)" },
  { emoji: "🔗", bg: "linear-gradient(135deg,#1a0a00,#2a1500)" },
  { emoji: "🌐", bg: "linear-gradient(135deg,#1a1a00,#2a2000)" },
  { emoji: "📚", bg: "linear-gradient(135deg,#001a1a,#002a2a)" },
  { emoji: "🔐", bg: "linear-gradient(135deg,#1a0010,#2a0020)" },
];

const FILTER_OPTIONS = [
  { key: "all",       label: "Все курсы" },
  { key: "progress",  label: "В процессе" },
  { key: "new",       label: "Не начаты" },
  { key: "done",      label: "Завершены" },
];

export default function Courses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [courses, setCourses]       = useState([]);
  const [progresses, setProgresses] = useState({});
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("all");
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState({ title: "", description: "" });
  const [saving, setSaving]         = useState(false);

  // Загружаем курсы
  useEffect(() => {
    getCourses()
      .then(async (res) => {
        const list = res.data;
        setCourses(list);

        // Если залогинен — подгружаем прогресс по каждому курсу
        if (user) {
          const entries = await Promise.allSettled(
            list.map((c) => getCourseProgress(c.id))
          );
          const map = {};
          entries.forEach((e, i) => {
            if (e.status === "fulfilled") {
              map[list[i].id] = e.value.data;
            }
          });
          setProgresses(map);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Фильтрация
  const filtered = courses.filter((c) => {
  const p = progresses[c.id];
  const percent = p?.progress ?? 0;
  if (filter === "all")      return true;
  if (filter === "done")     return percent === 100;
  if (filter === "progress") return percent > 0 && percent < 100;
  if (filter === "new")      return percent === 0;
  return true;
});

  // Создание курса (только для admin)
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createCourse(form);
      setCourses((prev) => [...prev, res.data]);
      setShowModal(false);
      setForm({ title: "", description: "" });
    } catch {
      alert("Ошибка при создании курса");
    } finally {
      setSaving(false);
    }
  };

  // Удаление курса
  const handleDelete = async (e, id) => {
    e.stopPropagation(); // не переходим на страницу курса
    if (!window.confirm("Удалить курс?")) return;
    try {
      await deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Ошибка при удалении");
    }
  };

  const getProgress = (courseId) => {
  const p = progresses[courseId];
  if (!p) return { percent: 0, completed: 0, total: 0 };
  return {
    percent: p.progress ?? 0,
    completed: p.completed_tasks ?? 0,
    total: p.total_tasks ?? 0,
  };
};

  const getButtonLabel = (percent) => {
    if (percent === 100) return "✓ Завершён";
    if (percent > 0)     return "Продолжить →";
    return "Начать →";
  };

  return (
    <div className={s.page}>
      {/* HEADER */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.label}>// обучение</div>
          <h1 className={s.title}>Курсы</h1>
          <p className={s.sub}>Выбери курс и начни учиться прямо сейчас</p>
        </div>

        {/* Кнопка создания — только для админа */}
        {isAdmin && (
          <button className={s.btnAdmin} onClick={() => setShowModal(true)}>
            + Создать курс
          </button>
        )}
      </div>

      {/* FILTERS */}
      <div className={s.filters}>
        {FILTER_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            className={`${s.filterBtn} ${filter === key ? s.filterActive : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* GRID */}
      {loading ? (
        <div className={s.loading}>Загрузка курсов...</div>
      ) : (
        <div className={s.grid}>
          {filtered.length === 0 ? (
            <div className={s.empty}>
              <span className={s.emptyIcon}>📭</span>
              Курсов не найдено
            </div>
          ) : (
            filtered.map((course, i) => {
              const banner  = BANNERS[i % BANNERS.length];
              const prog    = getProgress(course.id);
              const percent = prog.percent ?? 0;
              const isDone  = percent === 100;

              return (
                <div
                  key={course.id}
                  className={s.card}
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  {/* Баннер */}
                  <div className={s.banner} style={{ background: banner.bg }}>
                    <span className={s.bannerIcon}>{banner.emoji}</span>

                    {/* Кнопки админа на карточке */}
                    {isAdmin && (
                      <div className={s.cardAdminBtns}>
                        <button
                          className={s.btnCardDelete}
                          onClick={(e) => handleDelete(e, course.id)}
                          title="Удалить курс"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Тело карточки */}
                  <div className={s.body}>
                    <div className={s.cardTitle}>{course.title}</div>
                    <div className={s.cardDesc}>{course.description}</div>

                    {/* Прогресс */}
                    {user && (
                      <>
                        <div className={s.progressRow}>
                          <span className={s.progressLabel}>Прогресс</span>
                          <span className={s.progressVal}>
                            {prog.completed ?? 0} / {prog.total ?? 0} уроков
                          </span>
                        </div>
                        <div className={s.progressTrack}>
                          <div
                            className={`${s.progressFill} ${isDone ? s.progressFillDone : ""}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </>
                    )}

                    {/* Футер */}
                    <div className={s.footer}>
                      <div className={s.meta}>
                        <span className={s.metaItem}>📚 курс</span>
                      </div>
                      <button
                        className={`${s.cardBtn} ${isDone ? s.cardBtnDone : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/courses/${course.id}`);
                        }}
                      >
                        {getButtonLabel(percent)}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL — создание курса (только admin) */}
      {showModal && (
        <div className={s.overlay} onClick={() => setShowModal(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <button className={s.modalClose} onClick={() => setShowModal(false)}>×</button>
            <div className={s.modalTitle}>Создать курс</div>
            <form className={s.form} onSubmit={handleCreate}>
              <div>
                <label className={s.formLabel}>Название</label>
                <input
                  className={s.formInput}
                  placeholder="Python с нуля"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={s.formLabel}>Описание</label>
                <textarea
                  className={s.formTextarea}
                  placeholder="Краткое описание курса..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className={s.formSubmit} disabled={saving}>
                {saving ? "Создаём..." : "Создать курс"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}