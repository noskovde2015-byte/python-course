import { useEffect, useState } from "react";
import { getPackages, buyPackage } from "../api/payments";
import { useAuth } from "../context/AuthContext";

export default function Shop() {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPackages()
      .then((res) => setPackages(res.data))
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = async (id) => {
    try {
      const res = await buyPackage(id);
      window.location.href = res.data.checkout_url;
    } catch {
      alert("Ошибка при создании платежа");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 2rem" }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--purple)", fontFamily: "monospace", marginBottom: 6 }}>// донат</div>
      <h1 style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>Магазин звёзд</h1>
      <p style={{ fontSize: 13, color: "var(--muted)", fontFamily: "monospace", marginBottom: "2rem" }}>Покупай звёзды и открывай подсказки к задачам</p>

      {user && (
        <div style={{ marginBottom: "1.5rem", display: "inline-flex", alignItems: "center", gap: 8, background: "var(--purple3)", border: "1px solid rgba(155,127,244,0.25)", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>
          <span style={{ color: "var(--purple)" }}>⭐</span>
          Твой баланс: <span style={{ color: "var(--purple)", fontFamily: "monospace" }}>{user.stars}</span> звёзд
        </div>
      )}

      {loading ? (
        <div style={{ color: "var(--muted)", fontFamily: "monospace", fontSize: 13 }}>Загрузка...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              style={{ background: "var(--card)", border: "1px solid var(--border2)", borderRadius: 13, padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", transition: "border-color 0.2s, transform 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(155,127,244,0.4)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>⭐</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--purple)", letterSpacing: -1, marginBottom: 4 }}>{pkg.stars}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{pkg.title}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace", marginBottom: "1.25rem" }}>{pkg.amount} ₽</div>
              <button
                onClick={() => handleBuy(pkg.id)}
                style={{ width: "100%", padding: "9px", background: "var(--purple)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => e.target.style.background = "var(--purple2)"}
                onMouseLeave={(e) => e.target.style.background = "var(--purple)"}
              >
                Купить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}