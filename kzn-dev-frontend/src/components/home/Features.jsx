// src/components/home/Features.jsx
import s from "./Features.module.css";

const FEATURES = [
  { icon: "📚", title: "Структурированные курсы",  desc: "Модули → уроки → задачи. Последовательный путь без хаоса." },
  { icon: "⚡", title: "Проверка кода онлайн",     desc: "Пиши код в браузере, получай мгновенный фидбек по тест-кейсам." },
  { icon: "⭐", title: "Система звёзд",             desc: "Ежедневные награды и бонусы за активность на платформе." },
  { icon: "💬", title: "Вопросы к задачам",         desc: "Задавай вопросы прямо под задачей, получай ответы." },
  { icon: "🔐", title: "Безопасная авторизация",    desc: "JWT + Refresh токены, безопасное хранение сессий." },
  { icon: "💳", title: "Магазин звёзд",             desc: "Пополняй баланс и открывай дополнительные материалы." },
];

export default function Features() {
  return (
    <section className={s.section}>
      <div className={s.label}>// что внутри</div>
      <h2 className={s.title}>Всё для старта в разработке</h2>
      <div className={s.grid}>
        {FEATURES.map((f) => (
          <div key={f.title} className={s.card}>
            <div className={s.icon}>{f.icon}</div>
            <div className={s.cardTitle}>{f.title}</div>
            <div className={s.cardDesc}>{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}