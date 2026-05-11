import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProblems,
  getProblemsStats,
  createProblem,
  deleteProblem,
} from "../api/problems";
import Badge from "../components/ui/Badge";
import s from "./Problems.module.css";

const DIFFICULTIES = ["easy", "medium", "hard"];

const DEFAULT_FORM = {
  title: "",
  description: "",
  difficulty: "easy",
  test_cases: [{ input: "", output: "" }],
};

export default function Problems() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [problems, setProblems]     = useState([]);
  const [solvedIds, setSolvedIds]   = useState(new Set());
  const [solversCount, setSolversCount] = useState({});
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("all");
  const [showSolved, setShowSolved] = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(DEFAULT_FORM);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [problemsRes, statsRes] = await Promise.allSettled([
          getProblems(),
          user ? getProblemsStats() : Promise.resolve(null),
        ]);

        if (problemsRes.status === "fulfilled") {
          setProblems(problemsRes.value.data);
        }

        if (statsRes.status === "fulfilled" && statsRes.value) {
          const stats = statsRes.value.data;
          setSolvedIds(new Set(stats.solved_problem_ids ?? []));
          setSolversCount(stats.solvers_count ?? {});
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const filtered = problems.filter((p) => {
    if (filter !== "all" && p.difficulty?.toLowerCase() !== filter) return false;
    if (showSolved && !solvedIds.has(p.id)) return false;
    return true;
  });

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Удалить задачу?")) return;
    try {
      await deleteProblem(id);
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch { alert("Ошибка при удалении"); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createProblem({
        title: form.title,
        description: form.description,
        difficulty: form.difficulty,
        test_cases: form.test_cases.filter(
          (tc) => tc.input !== "" || tc.output !== ""
        ),
      });
      setProblems((prev) => [...prev, res.data]);
      setShowModal(false);
      setForm(DEFAULT_FORM);
    } catch (err) {
      alert(err.response?.data?.detail || "Ошибка при создании задачи");
    } finally {
      setSaving(false);
    }
  };

  const addTc    = () => setForm((f) => ({ ...f, test_cases: [...f.test_cases, { input: "", output: "" }] }));
  const removeTc = (i) => setForm((f) => ({ ...f, test_cases: f.test_cases.filter((_, idx) => idx !== i) }));
  const setTc    = (i, key, val) => setForm((f) => {
    const tc = [...f.test_cases]; tc[i] = { ...tc[i], [key]: val };
    return { ...f, test_cases: tc };
  });

  const easyCount   = problems.filter((p) => p.difficulty?.toLowerCase() === "easy").length;
  const mediumCount = problems.filter((p) => p.difficulty?.toLowerCase() === "medium").length;
  const hardCount   = problems.filter((p) => p.difficulty?.toLowerCase() === "hard").length;
  const solvedCount = solvedIds.size;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <div className={s.label}>// алгоритмы & структуры данных</div>
          <h1 className={s.title}>Задачи</h1>
        </div>
        {isAdmin && (
          <button className={s.btnAdmin} onClick={() => setShowModal(true)}>
            + Создать задачу
          </button>
        )}
      </div>

      {/* STATS */}
      <div className={s.statsRow}>
        {[
          { icon: "📋", num: problems.length, lbl: "всего задач" },
          { icon: "✅", num: solvedCount,     lbl: "решено тобой" },
          { icon: "🟡", num: mediumCount,     lbl: "medium" },
          { icon: "🔴", num: hardCount,       lbl: "hard" },
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

      {/* FILTERS */}
      <div className={s.filters}>
        <button
          className={`${s.filterBtn} ${filter === "all" ? s.filterActive : ""}`}
          onClick={() => setFilter("all")}
        >
          Все
        </button>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            className={`${s.filterBtn} ${filter === d ? s[`filter${d.charAt(0).toUpperCase() + d.slice(1)}`] : ""}`}
            onClick={() => setFilter(d)}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
        {user && (
          <button
            className={`${s.filterBtn} ${s.filterSolved} ${showSolved ? s.filterActive : ""}`}
            onClick={() => setShowSolved(!showSolved)}
          >
            ✓ Решённые
          </button>
        )}
      </div>

      {/* TABLE */}
      {loading ? (
        <div className={s.loading}>Загрузка задач...</div>
      ) : (
        <div className={s.table}>
          <div className={s.thead}>
            <span>#</span>
            <span>Задача</span>
            <span>Сложность</span>
            <span>Решений</span>
            <span>Статус</span>
          </div>

          {filtered.length === 0 ? (
            <div className={s.empty}>
              <span className={s.emptyIcon}>📭</span>
              Задач не найдено
            </div>
          ) : (
            filtered.map((p, i) => {
              const isSolved = solvedIds.has(p.id);
              const solvers  = solversCount[p.id] ?? 0;
              return (
                <div
                  key={p.id}
                  className={`${s.row} ${isSolved ? s.rowSolved : ""}`}
                  onClick={() => navigate(`/problems/${p.id}`)}
                >
                  <span className={s.rowNum}>{String(i + 1).padStart(3, "0")}</span>
                  <span className={s.rowTitle}>{p.title}</span>
                  <Badge type={p.difficulty?.toLowerCase()} />
                  <span className={s.rowSolutions}>{solvers > 0 ? solvers : "—"}</span>
                  <span className={s.rowStatus}>{isSolved ? "✅" : "—"}</span>
                  {isAdmin && (
                    <button
                      className={s.rowDel}
                      onClick={(e) => handleDelete(e, p.id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className={s.overlay} onClick={() => setShowModal(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <button className={s.modalClose} onClick={() => setShowModal(false)}>×</button>
            <div className={s.modalTitle}>Создать задачу</div>
            <form className={s.form} onSubmit={handleCreate}>
              <div>
                <label className={s.formLabel}>Название</label>
                <input
                  className={s.formInput}
                  placeholder="Два числа в сумме"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={s.formLabel}>Описание (Markdown)</label>
                <textarea
                  className={s.formTextarea}
                  style={{ minHeight: 120 }}
                  placeholder={`Дан массив \`nums\`...\n\n**Пример:**\nInput: [2,7]\nOutput: [0,1]`}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={s.formLabel}>Сложность</label>
                <select
                  className={s.formSelect}
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className={s.formLabel}>Тест-кейсы</label>
                {form.test_cases.map((tc, i) => (
                  <div key={i} className={s.tcRow}>
                    <div className={s.tcHeader}>
                      <span className={s.tcLabel}>Тест {i + 1}</span>
                      {form.test_cases.length > 1 && (
                        <button type="button" className={s.btnRemove} onClick={() => removeTc(i)}>✕</button>
                      )}
                    </div>
                    <input
                      className={s.formInput}
                      placeholder='Input: "abcabcbb"'
                      value={tc.input}
                      onChange={(e) => setTc(i, "input", e.target.value)}
                    />
                    <input
                      className={s.formInput}
                      placeholder='Output: "3"'
                      value={tc.output}
                      onChange={(e) => setTc(i, "output", e.target.value)}
                    />
                  </div>
                ))}
                <button type="button" className={s.btnAdd} onClick={addTc}>
                  + Добавить тест-кейс
                </button>
              </div>
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