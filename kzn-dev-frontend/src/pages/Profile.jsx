import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../api/profile";
import { getCourses, getCourseProgress } from "../api/courses";
import s from "./Profile.module.css";

// Достижения — условия разблокировки
const ACHIEVEMENTS = [
  { emoji: "🔥", name: "7 дней",   unlocked: (p) => p.streak >= 7 },
  { emoji: "⚡", name: "10 задач", unlocked: (p) => p.solved_problems_count >= 10 },
  { emoji: "🎯", name: "50 задач", unlocked: (p) => p.solved_problems_count >= 50 },
  { emoji: "📚", name: "1 курс",   unlocked: (p) => p.completed_courses >= 1 },
  { emoji: "💎", name: "100 задач",unlocked: (p) => p.solved_problems_count >= 100 },
  { emoji: "👑", name: "Топ-1",    unlocked: (p) => p.rank === 1 },
];

function initials(name) {
  return name?.slice(0, 2).toUpperCase() ?? "??";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "сегодня";
  if (diff === 1) return "вчера";
  if (diff < 7)  return `${diff} дня назад`;
  if (diff < 30) return `${Math.floor(diff / 7)} нед. назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function formatJoinDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    month: "long", year: "numeric"
  });
}

function typeLabel(type) {
  if (type === "daily_reward") return "Ежедневная награда";
  if (type === "purchase")     return "Покупка пакета";
  if (type === "spend")        return "Подсказка куплена";
  return type;
}

// Строим activity map — 26 ячеек = ~6 месяцев
function buildActivityCells(activity) {
  const cells = [];
  const today = new Date();
  for (let i = 25; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    const key = d.toISOString().slice(0, 10);
    const count = activity[key] ?? 0;
    const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
    cells.push(level);
  }
  return cells;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [profile, setProfile]   = useState(null);
  const [courses, setCourses]   = useState([]);
  const [progresses, setProgresses] = useState({});
  const [loading, setLoading]   = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }

    const load = async () => {
      try {
        const [profileRes, coursesRes] = await Promise.all([
          getProfile(),
          getCourses(),
        ]);
        setProfile(profileRes.data);
        const courseList = coursesRes.data;
        setCourses(courseList);

        // Прогресс по курсам
        const progMap = {};
        await Promise.allSettled(
          courseList.map(async (c) => {
            const res = await getCourseProgress(c.id);
            progMap[c.id] = res.data;
          })
        );
        setProgresses(progMap);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const activityCells = useMemo(
    () => profile ? buildActivityCells(profile.activity ?? {}) : [],
    [profile]
  );

  // Считаем завершённые курсы
  const completedCourses = Object.values(progresses).filter(
    (p) => (p?.progress ?? 0) === 100
  ).length;

  // Считаем streak (дней подряд с решениями)
  const streak = useMemo(() => {
    if (!profile?.activity) return 0;
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (profile.activity[key]) count++;
      else if (i > 0) break;
    }
    return count;
  }, [profile]);

  if (loading) return <div className={s.loading}>Загрузка профиля...</div>;
  if (!profile) return <div className={s.loading}>Профиль не найден</div>;

  const profileWithMeta = { ...profile, streak, completed_courses: completedCourses };

  return (
    <div className={s.page}>
      {/* HERO */}
      <div className={s.hero}>
        <div className={s.heroTop}>
          <div className={s.avatar}>{initials(profile.nickname)}</div>
          <div className={s.heroInfo}>
            <div className={s.heroNick}>{profile.nickname}</div>
            <div className={s.heroRole}>
              {profile.role === "admin" ? "👑 ADMIN" :
               profile.role === "teacher" ? "🎓 TEACHER" : "👤 USER"}
            </div>
            <div className={s.heroMeta}>
              <span className={s.heroMetaItem}>
                📅 На платформе с {formatJoinDate(profile.created_at)}
              </span>
              <span className={s.heroMetaItem}>⭐ {profile.stars} звёзд</span>
              {profile.rank && (
                <span className={s.heroMetaItem}>🏆 #{profile.rank} в рейтинге</span>
              )}
            </div>
          </div>
          <button className={s.btnEdit} onClick={() => setShowEdit(true)}>
            ✏️ Редактировать
          </button>
        </div>

        <div className={s.statsStrip}>
          {[
            { num: profile.solved_problems_count, lbl: "задач решено",     color: "var(--green)" },
            { num: completedCourses,              lbl: "курсов завершено",  color: "var(--purple)" },
            { num: streak,                        lbl: "дней streak",       color: "var(--amber)" },
            { num: profile.completed_tasks,       lbl: "задач в курсах",    color: "var(--text)" },
          ].map(({ num, lbl, color }) => (
            <div key={lbl} className={s.statItem}>
              <div className={s.statNum} style={{ color }}>{num}</div>
              <div className={s.statLbl}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={s.layout}>
        {/* LEFT */}
        <div className={s.left}>

          {/* Activity */}
          <div className={s.card}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>Активность</span>
              <span className={s.cardMeta}>последние 6 месяцев</span>
            </div>
            <div className={s.activityGrid}>
              {activityCells.map((level, i) => (
                <div key={i} className={`${s.actCell} ${s[`act${level}`]}`} />
              ))}
            </div>
            <div className={s.actLegend}>
              <span className={s.actLegendLbl}>Меньше</span>
              <div className={s.actLegendCells}>
                {[0,1,2,3,4].map((l) => (
                  <div key={l} className={`${s.actLegendCell} ${s[`act${l}`]}`} />
                ))}
              </div>
              <span className={s.actLegendLbl}>Больше</span>
            </div>
          </div>

          {/* Solved problems */}
          <div className={s.card}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>Последние решённые задачи</span>
              <span className={s.cardMeta}>
                {profile.solved_problems_count} всего
              </span>
            </div>
            {profile.solved_problems.length === 0 ? (
              <div style={{ color: "var(--muted)", fontFamily: "IBM Plex Mono, monospace", fontSize: 13 }}>
                Задач пока не решено
              </div>
            ) : (
              profile.solved_problems.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className={s.probRow}
                  onClick={() => navigate(`/problems/${p.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <span className={`${s.probBadge} ${s[p.difficulty?.toLowerCase()]}`}>
                    {p.difficulty}
                  </span>
                  <span className={s.probTitle}>{p.title}</span>
                  <span className={s.probDate}>{formatDate(p.solved_at)}</span>
                </div>
              ))
            )}
          </div>

          {/* Course progress */}
          {courses.length > 0 && (
            <div className={s.card}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>Прогресс по курсам</span>
              </div>
              {courses.map((c) => {
                const prog = progresses[c.id];
                const pct  = prog?.progress ?? 0;
                const done = pct === 100;
                return (
                  <div
                    key={c.id}
                    className={s.courseRow}
                    onClick={() => navigate(`/courses/${c.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={s.courseTop}>
                      <span className={s.courseName}>{c.title}</span>
                      <span className={s.coursePct}>{pct}%</span>
                    </div>
                    <div className={s.courseBar}>
                      <div
                        className={`${s.courseFill} ${done ? s.courseFillDone : ""}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className={s.right}>
          {/* Streak */}
          <div className={s.card}>
            <div className={s.sideTitle}>🔥 Streak</div>
            <div className={s.streakBox}>
              <div className={s.streakNum}>{streak}</div>
              <div className={s.streakInfo}>
                <div className={s.streakLbl}>дней подряд</div>
                <div className={s.streakSub}>
                  {streak > 0 ? "Так держать!" : "Начни сегодня!"}
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className={s.card}>
            <div className={s.sideTitle}>🏅 Достижения</div>
            <div className={s.badgesGrid}>
              {ACHIEVEMENTS.map((a) => {
                const unlocked = a.unlocked(profileWithMeta);
                return (
                  <div
                    key={a.name}
                    className={`${s.badgeItem} ${!unlocked ? s.badgeLocked : ""}`}
                    title={unlocked ? a.name : `Заблокировано: ${a.name}`}
                  >
                    <div className={s.badgeEmoji}>{a.emoji}</div>
                    <div className={s.badgeName}>{a.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stars history */}
          <div className={s.card}>
            <div className={s.sideTitle}>⭐ История звёзд</div>
            {profile.stars_history.length === 0 ? (
              <div style={{ color: "var(--muted)", fontFamily: "IBM Plex Mono, monospace", fontSize: 12 }}>
                Транзакций пока нет
              </div>
            ) : (
              profile.stars_history.map((t, i) => (
                <div key={i} className={s.starsRow}>
                  <span className={s.starsType}>{typeLabel(t.type)}</span>
                  <span className={t.amount > 0 ? s.starsPos : s.starsNeg}>
                    {t.amount > 0 ? "+" : ""}{t.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEdit && (
        <div className={s.overlay} onClick={() => setShowEdit(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <button className={s.modalClose} onClick={() => setShowEdit(false)}>×</button>
            <div className={s.modalTitle}>Редактировать профиль</div>
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                setShowEdit(false);
              }}
            >
              <div>
                <label className={s.formLabel}>Никнейм</label>
                <input
                  className={s.formInput}
                  defaultValue={profile.nickname}
                  placeholder="cool_dev"
                />
              </div>
              <div>
                <label className={s.formLabel}>Email</label>
                <input
                  className={s.formInput}
                  type="email"
                  defaultValue={profile.email}
                  placeholder="you@example.com"
                />
              </div>
              <button type="submit" className={s.formSubmit}>
                Сохранить изменения
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}