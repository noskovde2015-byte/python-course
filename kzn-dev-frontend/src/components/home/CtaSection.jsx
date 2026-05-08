// src/components/home/CtaSection.jsx
import { Link } from "react-router-dom";
import s from "./CtaSection.module.css";

export default function CtaSection() {
  return (
    <div className={s.section}>
      <div className={s.glow} />
      <h2 className={s.title}>Начни сегодня — бесплатно</h2>
      <p className={s.sub}>Регистрация занимает 30 секунд. Первые курсы уже ждут.</p>
      <div className={s.btns}>
        <Link to="/register" className={s.btnPrimary}>Создать аккаунт →</Link>
        <Link to="/login"    className={s.btnGhost}>Войти</Link>
      </div>
    </div>
  );
}