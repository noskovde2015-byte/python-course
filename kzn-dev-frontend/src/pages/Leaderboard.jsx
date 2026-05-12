import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getLeaderboard } from "../api/problems";
import s from "./Leaderboard.module.css";

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_ORDER = [1, 0, 2]; // второй, первый, третий для визуального эффекта пьедестала

function initials(name) {
  return name?.slice(0, 2).toUpperCase() ?? "??";
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then((res) => setLeaders(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Находим позицию текущего пользователя
  const myIndex = user
    ? leaders.findIndex((l) => l.nickname === user.nickname)
    : -1;
  const myPosition = myIndex >= 0 ? myIndex + 1 : null;
  const myData = myIndex >= 0 ? leaders[myIndex] : null;

  // Топ-3 для пьедестала
  const top3 = leaders.slice(0, 3);
  // Остальные
  const rest = leaders.slice(3);

  if (loading) return <div className={s.loading}>Загрузка таблицы...</div>;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.label}>// рейтинг</div>
        <h1 className={s.title}>Таблица лидеров</h1>
        <p className={s.sub}>Рейтинг по количеству решённых задач</p>
      </div>

      {/* Моя позиция */}
      {user && myPosition && (
        <div className={s.myPosition}>
          <div className={s.myPositionLeft}>
            <div className={s.rowAvatar} style={{ width: 40, height: 40, fontSize: 13 }}>
              {initials(user.nickname)}
            </div>
            <div>
              <div className={s.myPositionText}>
                {user.nickname}
                <span className={s.youBadge}>ты</span>
              </div>
              <div className={s.myPositionSub}>
                {myData?.solved ?? 0} задач решено
              </div>
            </div>
          </div>
          <div>
            <div className={s.myPositionRank}>#{myPosition}</div>
          </div>
        </div>
      )}

      {leaders.length === 0 ? (
        <div className={s.empty}>
          <span className={s.emptyIcon}>🏆</span>
          Пока никто не решил ни одной задачи
        </div>
      ) : (
        <>
          {/* PODIUM — топ 3 */}
          {top3.length >= 1 && (
            <div className={s.podium}>
              {PODIUM_ORDER.map((idx) => {
                const leader = top3[idx];
                if (!leader) return <div key={idx} />;
                const isMe = user?.nickname === leader.nickname;
                const podiumClass =
                  idx === 0 ? s.podiumFirst :
                  idx === 1 ? s.podiumSecond :
                  s.podiumThird;

                return (
                  <div key={leader.nickname} className={`${s.podiumCard} ${podiumClass}`}>
                    <span className={s.podiumMedal}>{MEDALS[idx]}</span>
                    <div className={s.podiumRank}>
                      {idx === 0 ? "1 место" : idx === 1 ? "2 место" : "3 место"}
                    </div>
                    <div className={s.podiumAvatar}>
                      {initials(leader.nickname)}
                    </div>
                    <div className={s.podiumNick}>
                      {leader.nickname}
                      {isMe && <span className={s.youBadge}>ты</span>}
                    </div>
                    <div className={s.podiumSolved}>
                      <span>{leader.solved}</span> задач
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Остальные */}
          {rest.length > 0 && (
            <div className={s.tableWrap}>
              <div className={s.thead}>
                <span>Место</span>
                <span>Участник</span>
                <span style={{ textAlign: "right" }}>Решено</span>
              </div>
              {rest.map((leader, i) => {
                const rank = i + 4;
                const isMe = user?.nickname === leader.nickname;
                return (
                  <div
                    key={leader.nickname}
                    className={`${s.row} ${isMe ? s.rowMe : ""}`}
                  >
                    <span className={`${s.rowRank} ${rank <= 10 ? s.rowRankTop : ""}`}>
                      #{rank}
                    </span>
                    <div className={s.rowUser}>
                      <div className={s.rowAvatar}>{initials(leader.nickname)}</div>
                      <span className={s.rowNick}>
                        {leader.nickname}
                        {isMe && <span className={s.youBadge}>ты</span>}
                      </span>
                    </div>
                    <div className={s.rowSolved}>
                      {leader.solved}
                      <span className={s.rowSolvedLabel}> задач</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}