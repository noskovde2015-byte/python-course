import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCourseById, getModules, getLessons } from "../api/courses";
import { getTasks, createTask, deleteTask, submitTask } from "../api/tasks";
import s from "./LessonDetail.module.css";

// Типы задач
const TASK_TYPES = [
  { value: "quiz",     label: "Quiz — один правильный ответ" },
  { value: "multiple", label: "Multiple — несколько правильных" },
  { value: "text",     label: "Text — текстовый ответ" },
  { value: "code",     label: "Code — с тест-кейсами" },
];

// Дефолтная форма создания задачи
const DEFAULT_FORM = {
  type: "quiz",
  question: "",
  answer: "",
  options: ["", ""],
  correct_answers: [],
  multiple: false,
  test_cases: [{ input: "", expected_output: "" }],
};

export default function LessonDetail() {
  const { id: courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [course, setCourse]       = useState(null);
  const [modules, setModules]     = useState([]);
  const [allLessons, setAllLessons] = useState({}); // { moduleId: [...] }
  const [lesson, setLesson]       = useState(null);
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState("content"); // "content" | "tasks"

  // Состояния ответов
  const [answers, setAnswers]     = useState({}); // { taskId: answer }
  const [results, setResults]     = useState({}); // { taskId: { correct, completed } }
  const [submitting, setSubmitting] = useState({});

  // Модалка создания задачи
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(DEFAULT_FORM);
  const [saving, setSaving]       = useState(false);

  // Загрузка всего
  useEffect(() => {
    const load = async () => {
      try {
        const [courseRes, modulesRes] = await Promise.all([
          getCourseById(courseId),
          getModules(courseId),
        ]);
        setCourse(courseRes.data);
        const mods = modulesRes.data;
        setModules(mods);

        // Загружаем уроки всех модулей для сайдбара
        const lessonsMap = {};
        let currentLesson = null;

        await Promise.all(
          mods.map(async (mod) => {
            const res = await getLessons(mod.id);
            lessonsMap[mod.id] = res.data;
            const found = res.data.find((l) => String(l.id) === String(lessonId));
            if (found) currentLesson = found;
          })
        );

        setAllLessons(lessonsMap);
        setLesson(currentLesson);

        // Задачи урока
        if (currentLesson) {
          const tasksRes = await getTasks(lessonId);
          setTasks(tasksRes.data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, lessonId]);

  // Получаем плоский список всех уроков для навигации prev/next
  const flatLessons = modules.flatMap((m) => allLessons[m.id] ?? []);
  const currentIndex = flatLessons.findIndex((l) => String(l.id) === String(lessonId));
  const prevLesson = flatLessons[currentIndex - 1] ?? null;
  const nextLesson = flatLessons[currentIndex + 1] ?? null;

  // Отправка ответа
  const handleSubmit = async (task) => {
    const answer = answers[task.id];
    if (!answer && answer !== 0) return;

    setSubmitting((prev) => ({ ...prev, [task.id]: true }));
    try {
      const res = await submitTask(task.id, answer);
      setResults((prev) => ({ ...prev, [task.id]: res.data }));
    } catch {
      setResults((prev) => ({ ...prev, [task.id]: { correct: false, completed: false } }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [task.id]: false }));
    }
  };

  // Выбор варианта ответа (quiz)
  const selectOption = (taskId, option, isMultiple) => {
    if (results[taskId]?.completed) return;
    if (isMultiple) {
      setAnswers((prev) => {
        const cur = Array.isArray(prev[taskId]) ? prev[taskId] : [];
        return {
          ...prev,
          [taskId]: cur.includes(option)
            ? cur.filter((o) => o !== option)
            : [...cur, option],
        };
      });
    } else {
      setAnswers((prev) => ({ ...prev, [taskId]: option }));
    }
  };

  // Удалить задачу
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Удалить задачу?")) return;
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch { alert("Ошибка при удалении"); }
  };

  // Создать задачу
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { type: form.type, question: form.question };

      if (form.type === "quiz") {
        payload.options = form.options.filter(Boolean);
        payload.correct_answers = [form.correct_answers[0]].filter(Boolean);
      } else if (form.type === "multiple") {
        payload.options = form.options.filter(Boolean);
        payload.correct_answers = form.correct_answers.filter(Boolean);
        payload.multiple = true;
      } else if (form.type === "text") {
        payload.answer = form.answer;
      } else if (form.type === "code") {
        payload.test_cases = form.test_cases.filter(
          (tc) => tc.input !== "" || tc.expected_output !== ""
        );
      }

      const res = await createTask(lessonId, payload);
      setTasks((prev) => [...prev, res.data]);
      setShowModal(false);
      setForm(DEFAULT_FORM);
      setTab("tasks"); // переключаемся на вкладку задач
    } catch (err) {
      alert(err.response?.data?.detail || "Ошибка при создании задачи");
    } finally {
      setSaving(false);
    }
  };

  // Добавить/удалить вариант ответа в форме
  const addOption = () =>
    setForm((f) => ({ ...f, options: [...f.options, ""] }));
  const removeOption = (i) =>
    setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));
  const setOption = (i, val) =>
    setForm((f) => { const o = [...f.options]; o[i] = val; return { ...f, options: o }; });
  const toggleCorrect = (val) =>
    setForm((f) => ({
      ...f,
      correct_answers: f.correct_answers.includes(val)
        ? f.correct_answers.filter((v) => v !== val)
        : [...f.correct_answers, val],
    }));

  // Тест-кейсы
  const addTestCase = () =>
    setForm((f) => ({ ...f, test_cases: [...f.test_cases, { input: "", expected_output: "" }] }));
  const removeTestCase = (i) =>
    setForm((f) => ({ ...f, test_cases: f.test_cases.filter((_, idx) => idx !== i) }));
  const setTestCase = (i, key, val) =>
    setForm((f) => {
      const tc = [...f.test_cases];
      tc[i] = { ...tc[i], [key]: val };
      return { ...f, test_cases: tc };
    });

  const completedCount = Object.values(results).filter((r) => r.completed).length;

  if (loading) return <div className={s.loading}>Загрузка урока...</div>;

  return (
    <div className={s.layout}>
      {/* ===== SIDEBAR ===== */}
      <div className={s.sidebar}>
        <button className={s.back} onClick={() => navigate(`/courses/${courseId}`)}>
          ← {course?.title ?? "Курс"}
        </button>

        {modules.map((mod, mi) => {
          const modLessons = allLessons[mod.id] ?? [];
          if (modLessons.length === 0) return null;
          return (
            <div key={mod.id} className={s.modGroup}>
              <div className={s.modTitle}>
                {String(mi + 1).padStart(2, "0")} · {mod.title}
              </div>
              {modLessons.map((l) => {
                const isActive = String(l.id) === String(lessonId);
                return (
                  <div
                    key={l.id}
                    className={`${s.lessonLink} ${isActive ? s.lessonLinkActive : ""}`}
                    onClick={() => navigate(`/courses/${courseId}/lessons/${l.id}`)}
                  >
                    <div className={`${s.lCheck} ${isActive ? s.lCheckActive : ""}`} />
                    <span className={s.lName}>{l.title}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ===== MAIN ===== */}
      <div className={s.main}>
        {/* Header */}
        <div className={s.lessonHeader}>
          <div className={s.lessonLabel}>
            // урок {currentIndex + 1} из {flatLessons.length}
          </div>
          <h1 className={s.lessonTitle}>{lesson?.title ?? "Урок"}</h1>
          <div className={s.lessonMeta}>
            <span className={s.metaBadge}>📖 Урок</span>
            <span className={s.metaBadge}>🎯 {tasks.length} заданий</span>
            {completedCount > 0 && (
              <span className={s.metaBadge} style={{ color: "var(--green)" }}>
                ✓ {completedCount} / {tasks.length} выполнено
              </span>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className={s.tabs}>
          <button
            className={`${s.tab} ${tab === "content" ? s.tabActive : ""}`}
            onClick={() => setTab("content")}
          >
            📖 Материал
          </button>
          <button
            className={`${s.tab} ${tab === "tasks" ? s.tabActive : ""}`}
            onClick={() => setTab("tasks")}
          >
            🎯 Задания
            {tasks.length > 0 && (
              <span className={s.tabBadge}>{tasks.length}</span>
            )}
          </button>
        </div>

        {/* ===== TAB: CONTENT ===== */}
        {tab === "content" && (
          <>
            {lesson?.content ? (
              <div
                className={s.content}
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            ) : (
              <div className={s.emptyContent}>Контент урока ещё не добавлен</div>
            )}
          </>
        )}

        {/* ===== TAB: TASKS ===== */}
        {tab === "tasks" && (
          <>
            {/* Кнопка добавить задачу для админа */}
            {isAdmin && (
              <div className={s.adminRow}>
                <button className={s.btnSm} onClick={() => setShowModal(true)}>
                  + Добавить задачу
                </button>
              </div>
            )}

            <div className={s.tasksHeader}>
              <span className={s.tasksTitle}>Задания к уроку</span>
              <span className={s.tasksCount}>
                {completedCount} / {tasks.length} выполнено
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className={s.emptyTasks}>
                <span className={s.emptyIcon}>📭</span>
                {isAdmin ? "Задач пока нет. Добавь первую!" : "Заданий пока нет"}
              </div>
            ) : (
              tasks.map((task) => {
                const result  = results[task.id];
                const answer  = answers[task.id];
                const isDone  = result?.completed;
                const isRight = result?.correct;

                return (
                  <div
                    key={task.id}
                    className={`${s.task} ${isDone && isRight ? s.taskCorrect : ""} ${isDone && !isRight ? s.taskWrong : ""}`}
                  >
                    <div className={s.taskTop}>
                      <div className={s.taskQ}>{task.question}</div>
                      <span className={s.taskType}>{task.type}</span>
                    </div>

                    {/* Кнопка удаления для админа */}
                    {isAdmin && (
                      <div className={s.taskAdminBtns}>
                        <button className={s.btnTaskDel} onClick={() => handleDeleteTask(task.id)}>
                          ✕ Удалить задачу
                        </button>
                      </div>
                    )}

                    {/* Quiz / Multiple */}
                    {(task.type === "quiz" || task.type === "multiple") && task.options && (
                      <div className={s.options}>
                        {task.options.map((opt) => {
                          const isSelected = task.type === "multiple"
                            ? Array.isArray(answer) && answer.includes(opt)
                            : answer === opt;
                          const isCorrect = isDone && isRight && isSelected;
                          const isWrong   = isDone && !isRight && isSelected;

                          return (
                            <div
                              key={opt}
                              className={`${s.opt} ${isSelected ? s.optSelected : ""} ${isCorrect ? s.optCorrect : ""} ${isWrong ? s.optWrong : ""}`}
                              onClick={() => selectOption(task.id, opt, task.type === "multiple")}
                            >
                              {isCorrect ? "✓ " : ""}{opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Text */}
                    {task.type === "text" && (
                      <input
                        className={s.textInput}
                        placeholder="Введи ответ..."
                        value={answer ?? ""}
                        disabled={isDone}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                      />
                    )}

                    {/* Code */}
                    {task.type === "code" && (
                      <textarea
                        className={s.textInput}
                        placeholder="# Напиши код здесь..."
                        style={{ minHeight: 120, fontFamily: "IBM Plex Mono, monospace", fontSize: 13 }}
                        value={answer ?? ""}
                        disabled={isDone}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                      />
                    )}

                    <div className={s.taskFooter}>
                      <span className={`${s.taskResult} ${isRight ? s.taskResultOk : isDone ? s.taskResultErr : ""}`}>
                        {isDone ? (isRight ? "✓ Верно!" : "✗ Неверно") : ""}
                      </span>
                      <button
                        className={s.btnSubmit}
                        disabled={isDone || submitting[task.id] || !answer}
                        onClick={() => handleSubmit(task)}
                      >
                        {isDone ? "Выполнено" : submitting[task.id] ? "..." : "Проверить"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Nav buttons */}
        <div className={s.navBtns}>
          <button
            className={`${s.btnNav} ${!prevLesson ? s.btnNavDisabled : ""}`}
            onClick={() => prevLesson && navigate(`/courses/${courseId}/lessons/${prevLesson.id}`)}
          >
            ← Предыдущий
          </button>
          <button
            className={`${s.btnNav} ${s.btnNavNext} ${!nextLesson ? s.btnNavDisabled : ""}`}
            onClick={() => nextLesson && navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
          >
            Следующий →
          </button>
        </div>
      </div>

      {/* ===== MODAL: СОЗДАНИЕ ЗАДАЧИ ===== */}
      {showModal && (
        <div className={s.overlay} onClick={() => setShowModal(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <button className={s.modalClose} onClick={() => setShowModal(false)}>×</button>
            <div className={s.modalTitle}>Создать задачу</div>

            <form className={s.form} onSubmit={handleCreateTask}>
              {/* Тип задачи */}
              <div>
                <label className={s.formLabel}>Тип задачи</label>
                <select
                  className={s.formSelect}
                  value={form.type}
                  onChange={(e) => setForm({ ...DEFAULT_FORM, type: e.target.value })}
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Вопрос */}
              <div>
                <label className={s.formLabel}>Вопрос</label>
                <textarea
                  className={s.formTextarea}
                  placeholder="Какой тип данных у значения 3.14?"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  required
                />
              </div>

              {/* === QUIZ / MULTIPLE — варианты ответа === */}
              {(form.type === "quiz" || form.type === "multiple") && (
                <>
                  <div>
                    <label className={s.formLabel}>Варианты ответа</label>
                    {form.options.map((opt, i) => (
                      <div key={i} className={s.optionRow}>
                        <input
                          className={s.formInput}
                          placeholder={`Вариант ${i + 1}`}
                          value={opt}
                          onChange={(e) => setOption(i, e.target.value)}
                        />
                        {form.options.length > 2 && (
                          <button
                            type="button"
                            className={s.btnRemoveOpt}
                            onClick={() => removeOption(i)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className={s.btnAddOpt} onClick={addOption}>
                      + Добавить вариант
                    </button>
                  </div>

                  <div>
                    <label className={s.formLabel}>
                      {form.type === "quiz" ? "Правильный ответ" : "Правильные ответы"}
                    </label>
                    <div className={s.correctList}>
                      {form.options.filter(Boolean).map((opt) => (
                        <label key={opt} className={s.correctItem}>
                          <input
                            type={form.type === "quiz" ? "radio" : "checkbox"}
                            name="correct"
                            checked={form.correct_answers.includes(opt)}
                            onChange={() => {
                              if (form.type === "quiz") {
                                setForm((f) => ({ ...f, correct_answers: [opt] }));
                              } else {
                                toggleCorrect(opt);
                              }
                            }}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* === TEXT — правильный ответ === */}
              {form.type === "text" && (
                <div>
                  <label className={s.formLabel}>Правильный ответ</label>
                  <input
                    className={s.formInput}
                    placeholder="x = 42"
                    value={form.answer}
                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                    required
                  />
                  <p className={s.formHint}>Ответ пользователя будет сравниваться с этим текстом</p>
                </div>
              )}

              {/* === CODE — тест-кейсы === */}
              {form.type === "code" && (
                <div>
                  <label className={s.formLabel}>Тест-кейсы</label>
                  {form.test_cases.map((tc, i) => (
                    <div key={i} style={{ marginBottom: "0.75rem", background: "var(--bg3)", borderRadius: 8, padding: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
                          Тест {i + 1}
                        </span>
                        {form.test_cases.length > 1 && (
                          <button type="button" className={s.btnRemoveOpt} onClick={() => removeTestCase(i)}>✕</button>
                        )}
                      </div>
                      <input
                        className={s.formInput}
                        placeholder="Input (например: [1, 2, 3])"
                        value={tc.input}
                        onChange={(e) => setTestCase(i, "input", e.target.value)}
                        style={{ marginBottom: 6 }}
                      />
                      <input
                        className={s.formInput}
                        placeholder="Expected output (например: 6)"
                        value={tc.expected_output}
                        onChange={(e) => setTestCase(i, "expected_output", e.target.value)}
                      />
                    </div>
                  ))}
                  <button type="button" className={s.btnAddOpt} onClick={addTestCase}>
                    + Добавить тест-кейс
                  </button>
                </div>
              )}

              <button type="submit" className={s.formSubmit} disabled={saving}>
                {saving ? "Создаём..." : "Создать задачу"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}