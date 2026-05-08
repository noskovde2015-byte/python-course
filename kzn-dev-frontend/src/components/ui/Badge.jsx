// src/components/ui/Badge.jsx
import s from "./Badge.module.css";

export default function Badge({ type }) {
  const label = { easy: "Easy", medium: "Medium", hard: "Hard" };
  return (
    <span className={`${s.badge} ${s[type]}`}>
      {label[type] ?? type}
    </span>
  );
}