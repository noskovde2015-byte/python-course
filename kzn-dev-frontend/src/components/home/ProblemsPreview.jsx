import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Badge from "../ui/Badge";
import s from "./ProblemsPreview.module.css";
import { getProblems, getLeaderboard } from "../../api/problems";

export default function ProblemsPreview() {
  const [problems, setProblems] = useState([]);
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    getProblems()
      .then((res) => setProblems(res.data.slice(0, 6)))
      .catch(() => {});

    getLeaderboard()
      .then((res) => setLeaders(res.data.slice(0, 4)))
      .catch(() => {});
  }, []);

  const initials = (name) => name?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <section className={s.section}>
      <div className={s.header}>
        <div>
          <div className={s.label}>// алгоритмы & структуры данных</div>
          <h2 className={s.title}>Задачи в стиле LeetCode</h2>
        </div>
        <Link to="/problems" className={s.allLink}>Все задачи →</Link>
      </div>

      <div className={s.layout}>
        {/* ТАБЛИЦА */}
        <div className={s.table}>
          <div className={s.thead}>
            <span>#</span>
            <span>Задача</span>
            <span>Сложность</span>
          </div>

          {problems.length === 0 ? (
            <div style={{
              padding: "1.5rem",
              color: "var(--muted)",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 13
            }}>
              Загрузка задач...
            </div>
          ) : (
            problems.map((p, i) => (
              <Link to={`/problems/${p.id}`} key={p.id} className={s.row}>
                <span className={s.num}>
                  {String(i + 1).padStart(3, "0")}
                </span>
                <span className={s.problemTitle}>
                  {p.title}
                  <small>{p.difficulty}</small>
                </span>
                <span>
                  <Badge type={p.difficulty?.toLowerCase()} />
                </span>
              </Link>
            ))
          )}
        </div>

        {/* САЙДБАР */}
        <div className={s.side}>
          <div className={s.sideCard}>
            <div className={s.sideTitle}>Топ решателей</div>

            {leaders.length === 0 ? (
              <div style={{
                color: "var(--muted)",
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: 12
              }}>
                Загрузка...
              </div>
            ) : (
              leaders.map((l, i) => (
                <div key={l.nickname} className={s.lbRow}>
                  <span className={`${s.lbRank} ${i < 3 ? s.lbRankTop : ""}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className={s.lbAvatar}>{initials(l.nickname)}</div>
                  <span className={s.lbName}>{l.nickname}</span>
                  <span className={s.lbStars}>✓ {l.solved}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}