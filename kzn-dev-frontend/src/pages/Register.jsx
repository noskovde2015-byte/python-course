import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", nickname: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Ошибка регистрации");
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 54px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 400, background: "var(--card)", border: "1px solid var(--border2)", borderRadius: 16, padding: "2rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>Регистрация</h1>
        <p style={{ fontSize: 13, color: "var(--muted)", fontFamily: "IBM Plex Mono, monospace", marginBottom: "1.5rem" }}>Создай аккаунт за 30 секунд</p>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "8px 12px", borderRadius: 8, background: "var(--red3)", border: "1px solid rgba(248,113,113,0.2)", color: "var(--red)", fontSize: 13, fontFamily: "monospace" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { key: "email",    label: "Email",    type: "email",    placeholder: "you@example.com" },
            { key: "nickname", label: "Никнейм",  type: "text",     placeholder: "cool_dev" },
            { key: "password", label: "Пароль",   type: "password", placeholder: "••••••••" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "monospace" }}>{label}</label>
              <input
                type={type}
                required
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 8, color: "var(--text)", fontSize: 13.5, outline: "none" }}
                onFocus={(e) => e.target.style.borderColor = "var(--purple)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border2)"}
              />
            </div>
          ))}
          <button
            type="submit"
            style={{ marginTop: 8, padding: "11px", background: "var(--purple)", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.target.style.background = "var(--purple2)"; e.target.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.target.style.background = "var(--purple)"; e.target.style.transform = "translateY(0)"; }}
          >
            Создать аккаунт
          </button>
        </form>

        <p style={{ marginTop: "1.25rem", textAlign: "center", fontSize: 13, color: "var(--muted)", fontFamily: "monospace" }}>
          Уже есть аккаунт?{" "}
          <Link to="/login" style={{ color: "var(--purple)", fontWeight: 600 }}>Войти</Link>
        </p>
      </div>
    </div>
  );
}