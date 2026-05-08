import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { claimDaily } from "../../api/stars";
import s from "./Navbar.module.css";

const NAV_LINKS = [
  { to: "/", label: "Главная" },
  { to: "/courses", label: "Курсы" },
  { to: "/problems", label: "Задачи" },
  { to: "/leaderboard", label: "Таблица лидеров" },
  { to: "/shop", label: "Магазин ⭐" },
];

export default function Navbar() {
  const { user, setUser, logout } = useAuth();
  const { pathname } = useLocation();
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null); // null | "ok" | "already"

  const handleClaim = async () => {
    if (claiming || claimStatus) return;
    setClaiming(true);
    try {
      const res = await claimDaily();
      setUser((prev) => ({ ...prev, stars: res.data.stars }));
      setClaimStatus("ok");
    } catch {
      setClaimStatus("already");
    } finally {
      setClaiming(false);
      setTimeout(() => setClaimStatus(null), 3000);
    }
  };

  const rewardLabel = () => {
    if (claiming) return "..."
    if (claimStatus === "ok") return "✓ +50 ⭐"
    if (claimStatus === "already") return "Уже забрал"
    return "🎁 Награда"
  };

  return (
    <nav className={s.nav}>
      <Link to="/" className={s.logo}>
        KZN<span>.Dev</span> 🔒
      </Link>

      <ul className={s.links}>
        {NAV_LINKS.map(({ to, label }) => (
          <li key={to}>
            <Link
              to={to}
              className={`${s.link} ${pathname === to ? s.linkActive : ""}`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className={s.actions}>
        {user ? (
          <>
            {/* Кнопка ежедневной награды */}
            <button
              onClick={handleClaim}
              className={`${s.btnReward} ${claimStatus === "already" ? s.btnRewardDone : ""}`}
              disabled={!!claimStatus || claiming}
            >
              {rewardLabel()}
            </button>

            {/* Баланс звёзд */}
            <div className={s.starsBalance}>
              ⭐ <span>{user.stars ?? 0}</span>
            </div>

            {/* Разделитель */}
            <div className={s.divider} />

            {/* Никнейм */}
            <span className={s.nickname}>{user.nickname}</span>

            {/* Выйти */}
            <button className={s.btnOutline} onClick={logout}>
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link to="/login"    className={s.btnOutline}>Войти</Link>
            <Link to="/register" className={s.btnFill}>Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
}