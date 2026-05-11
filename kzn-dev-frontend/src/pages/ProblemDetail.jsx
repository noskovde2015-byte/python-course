import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProblemById, submitSolution, buyHint, createHint, getProblemsStats } from "../api/problems";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../context/AuthContext";
import s from "./ProblemDetail.module.css";

const DEFAULT_CODE = `def solution():
    # Напиши решение здесь
    pass
`;

const DEFAULT_HINT_FORM = { text: "", price: 50, order: 1 };

export default function ProblemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const isAdmin = user?.role === "admin";

  const [problem, setProblem]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [code, setCode]           = useState(DEFAULT_CODE);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]       = useState(null);
  const [buyingHint, setBuyingHint] = useState({});

  // Модалка добавления подсказки
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintForm, setHintForm]           = useState(DEFAULT_HINT_FORM);
  const [savingHint, setSavingHint]       = useState(false);

  useEffect(() => {
  if (!user) {
    navigate("/login");
    return;
  }
  const load = async () => {
    try {
      const [problemRes, statsRes] = await Promise.all([
        getProblemById(id),
        getProblemsStats(),
      ]);
      setProblem(problemRes.data);

      // Восстанавливаем статус решения
      const solvedIds = new Set(statsRes.data.solved_problem_ids ?? []);
      if (solvedIds.has(Number(id))) {
        setResult({ correct: true, passed: -1, total: -1, restored: true });
      }
    } catch {
      navigate("/problems");
    } finally {
      setLoading(false);
    }
  };
  load();
}, [id, user]);

  // Отправить решение
  const handleSubmit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await submitSolution(id, code);
      setResult(res.data);
    } catch (err) {
      setResult({ correct: false, passed: 0, total: 0, error: true });
    } finally {
      setSubmitting(false);
    }
  };

  // Купить подсказку
  const handleBuyHint = async (hintId) => {
    setBuyingHint((prev) => ({ ...prev, [hintId]: true }));
    try {
      const res = await buyHint(hintId);
      // Обновляем подсказку в стейте
      setProblem((prev) => ({
        ...prev,
        hints: prev.hints.map((h) =>
          h.id === hintId
            ? { ...h, is_bought: true, text: res.data.hint }
            : h
        ),
      }));
      // Обновляем баланс звёзд
      const hint = problem.hints.find((h) => h.id === hintId);
      if (hint && setUser) {
        setUser((prev) => ({ ...prev, stars: (prev.stars ?? 0) - hint.price }));
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Ошибка при покупке подсказки");
    } finally {
      setBuyingHint((prev) => ({ ...prev, [hintId]: false }));
    }
  };

  // Создать подсказку (только admin)
  const handleCreateHint = async (e) => {
    e.preventDefault();
    setSavingHint(true);
    try {
      await createHint(id, {
        text: hintForm.text,
        price: Number(hintForm.price),
        order: Number(hintForm.order),
      });
      // Перезагружаем задачу чтобы получить новую подсказку
      const res = await getProblemById(id);
      setProblem(res.data);
      setShowHintModal(false);
      setHintForm(DEFAULT_HINT_FORM);
    } catch (err) {
      alert(err.response?.data?.detail || "Ошибка при создании подсказки");
    } finally {
      setSavingHint(false);
    }
  };

  if (loading) return <div className={s.loading}>Загрузка задачи...</div>;
  if (!problem) return <div className={s.loading}>Задача не найдена</div>;

  const hints = problem.hints ?? [];

  return (
    <div className={s.layout}>
      {/* ===== LEFT ===== */}
      <div className={s.left}>
        <button className={s.back} onClick={() => navigate("/problems")}>
          ← Все задачи
        </button>

        <div className={s.label}>// задача</div>
        <h1 className={s.title}>{problem.title}</h1>
        <div className={s.meta}>
          <span className={`${s.badge} ${s[problem.difficulty?.toLowerCase()]}`}>
            {problem.difficulty}
          </span>
          <span className={s.metaInfo}>
            {hints.length} подсказок
          </span>
        </div>

        {/* Admin кнопки */}
        {isAdmin && (
          <div className={s.adminRow}>
            <button className={s.btnSm} onClick={() => setShowHintModal(true)}>
              + Добавить подсказку
            </button>
          </div>
        )}

        {/* Описание */}
        <div className={s.desc}>
          <ReactMarkdown>{problem.description}</ReactMarkdown>
        </div>

        {/* Подсказки */}
        {hints.length > 0 && (
          <div className={s.hintsSection}>
            <div className={s.hintsTitle}>Подсказки</div>
            {hints.map((hint) => (
              <div key={hint.id} className={s.hintCard}>
                {hint.is_bought ? (
                  <div className={s.hintUnlocked}>
                    💡 {hint.text}
                  </div>
                ) : (
                  <>
                    <div className={s.hintLocked}>
                      🔒 Подсказка {hint.order}
                    </div>
                    <div className={s.hintBuyRow}>
                      <span className={s.hintPrice}>⭐ {hint.price}</span>
                      <button
                        className={s.btnBuyHint}
                        disabled={
                          buyingHint[hint.id] ||
                          (user?.stars ?? 0) < hint.price
                        }
                        onClick={() => handleBuyHint(hint.id)}
                        title={
                          (user?.stars ?? 0) < hint.price
                            ? "Недостаточно звёзд"
                            : "Купить подсказку"
                        }
                      >
                        {buyingHint[hint.id]
                          ? "..."
                          : (user?.stars ?? 0) < hint.price
                          ? "Мало звёзд"
                          : "Купить"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== RIGHT — редактор ===== */}
      <div className={s.right}>
        <div className={s.editorHeader}>
          <span className={s.editorLabel}>Решение</span>
          <span className={s.langBadge}>Python 3</span>
        </div>

        <textarea
          className={s.codeArea}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
        />

        {/* Результат */}
        {result && (
  <div className={`${s.result} ${result.correct ? s.resultOk : s.resultErr}`}>
    <div className={s.resultTitle}>
      {result.correct ? "✓ Задача решена!" : "✗ Есть ошибки"}
    </div>
    <div className={s.resultSub}>
      {result.restored
        ? "Ты уже решал эту задачу ранее"
        : result.error
        ? "Ошибка при выполнении кода"
        : `${result.passed} / ${result.total} тест-кейсов пройдено`}
    </div>
  </div>
)}

        <button
          className={s.btnSubmit}
          disabled={submitting || !code.trim()}
          onClick={handleSubmit}
        >
          {submitting ? "Проверяем..." : "Отправить решение →"}
        </button>
      </div>

      {/* MODAL — добавить подсказку */}
      {showHintModal && (
        <div className={s.overlay} onClick={() => setShowHintModal(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <button className={s.modalClose} onClick={() => setShowHintModal(false)}>×</button>
            <div className={s.modalTitle}>Добавить подсказку</div>
            <form className={s.form} onSubmit={handleCreateHint}>
              <div>
                <label className={s.formLabel}>Текст подсказки</label>
                <textarea
                  className={s.formTextarea}
                  placeholder="Попробуй использовать метод скользящего окна..."
                  value={hintForm.text}
                  onChange={(e) => setHintForm({ ...hintForm, text: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={s.formLabel}>Цена (⭐ звёзд)</label>
                <input
                  className={s.formInput}
                  type="number"
                  min="0"
                  value={hintForm.price}
                  onChange={(e) => setHintForm({ ...hintForm, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={s.formLabel}>Порядок</label>
                <input
                  className={s.formInput}
                  type="number"
                  min="1"
                  value={hintForm.order}
                  onChange={(e) => setHintForm({ ...hintForm, order: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className={s.formSubmit} disabled={savingHint}>
                {savingHint ? "Создаём..." : "Добавить подсказку"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}