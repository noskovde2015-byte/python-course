import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getPackages,
  buyPackage,
  getMockCheckout,
  confirmPayment,
  cancelPayment,
  getPaymentHistory,
} from "../api/payments";
import s from "./Shop.module.css";

// Иконки и "популярность" для пакетов
const PACKAGE_META = {
  1: { emoji: "⭐", popular: false },
  2: { emoji: "💫", popular: true  },
  3: { emoji: "🌟", popular: false },
};

function statusLabel(status) {
  if (status === "paid")     return { text: "Оплачено",  cls: s.statusPaid };
  if (status === "pending")  return { text: "Ожидание",  cls: s.statusPending };
  if (status === "canceled") return { text: "Отменено",  cls: s.statusCanceled };
  return { text: status, cls: "" };
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Shop() {
  const { user, setUser } = useAuth();

  const [packages, setPackages]   = useState([]);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [buying, setBuying]       = useState(null); // packageId

  // Мок-чекаут
  const [checkout, setCheckout]   = useState(null); // данные из /mock/:id
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess]     = useState(null); // { stars }

  useEffect(() => {
    const load = async () => {
      try {
        const [pkgRes, histRes] = await Promise.allSettled([
          getPackages(),
          user ? getPaymentHistory() : Promise.resolve(null),
        ]);
        if (pkgRes.status === "fulfilled") setPackages(pkgRes.value.data);
        if (histRes.status === "fulfilled" && histRes.value) {
          setHistory(histRes.value.data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Нажать "Купить" — создаём платёж и открываем мок-чекаут
  const handleBuy = async (packageId) => {
    if (!user) return;
    setBuying(packageId);
    try {
      // Создаём платёж
      const buyRes = await buyPackage(packageId);
      const paymentId = buyRes.data.payment_id;

      // Получаем данные для мок-страницы
      const mockRes = await getMockCheckout(paymentId);
      setCheckout(mockRes.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Ошибка при создании платежа");
    } finally {
      setBuying(null);
    }
  };

  // Подтвердить оплату
  const handleConfirm = async () => {
    if (!checkout) return;
    setProcessing(true);
    try {
      const res = await confirmPayment(checkout.payment_id);
      // Обновляем баланс пользователя
      if (setUser) {
        setUser((prev) => ({
          ...prev,
          stars: (prev.stars ?? 0) + res.data.stars_added,
        }));
      }
      setSuccess({ stars: res.data.stars_added });
      // Обновляем историю
      const histRes = await getPaymentHistory();
      setHistory(histRes.data);
      setCheckout(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Ошибка при подтверждении");
    } finally {
      setProcessing(false);
    }
  };

  // Отменить платёж
  const handleCancel = async () => {
    if (!checkout) return;
    setProcessing(true);
    try {
      await cancelPayment(checkout.payment_id);
      setCheckout(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Ошибка при отмене");
    } finally {
      setProcessing(false);
    }
  };

  const closeSuccess = () => setSuccess(null);

  if (loading) return <div className={s.loading}>Загрузка магазина...</div>;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.label}>// донат</div>
        <h1 className={s.title}>Магазин звёзд</h1>
        <p className={s.sub}>Покупай звёзды и открывай подсказки к задачам</p>
      </div>

      {/* Баланс */}
      {user && (
        <div className={s.balanceCard}>
          <div className={s.balanceLeft}>
            <span className={s.balanceIcon}>⭐</span>
            <div>
              <div className={s.balanceLabel}>Твой баланс</div>
              <div className={s.balanceAmount}>
                <span>{user.stars ?? 0}</span> звёзд
              </div>
            </div>
          </div>
          <div className={s.balanceHint}>
            Используй звёзды<br/>для покупки подсказок
          </div>
        </div>
      )}

      {/* Пакеты */}
      <div className={s.sectionLabel}>Выбери пакет</div>
      <div className={s.grid}>
        {packages.map((pkg) => {
          const meta = PACKAGE_META[pkg.id] ?? { emoji: "⭐", popular: false };
          return (
            <div
              key={pkg.id}
              className={`${s.card} ${meta.popular ? s.cardPopular : ""}`}
            >
              {meta.popular && (
                <span className={s.popularBadge}>POPULAR</span>
              )}
              <span className={s.cardEmoji}>{meta.emoji}</span>
              <div className={s.cardStars}>{pkg.stars}</div>
              <div className={s.cardStarsLabel}>звёзд</div>
              <div className={s.cardTitle}>{pkg.title}</div>
              <div className={s.cardPrice}>
                {pkg.amount} <span>₽</span>
              </div>
              <button
                className={s.btnBuy}
                disabled={!user || buying === pkg.id}
                onClick={() => handleBuy(pkg.id)}
              >
                {buying === pkg.id ? "Создаём платёж..." : "Купить →"}
              </button>
            </div>
          );
        })}
      </div>

      {/* История платежей */}
      {user && (
        <>
          <div className={s.sectionLabel}>История платежей</div>
          {history.length === 0 ? (
            <div className={s.historyEmpty}>
              Платежей пока нет
            </div>
          ) : (
            <div className={s.historyTable}>
              <div className={s.hHead}>
                <span>Дата</span>
                <span>Звёзды</span>
                <span>Сумма</span>
                <span>Статус</span>
              </div>
              {history.map((p) => {
                const { text, cls } = statusLabel(p.status);
                return (
                  <div key={p.id} className={s.hRow}>
                    <span className={s.hDate}>{formatDate(p.created_at)}</span>
                    <span className={s.hStars}>+{p.stars} ⭐</span>
                    <span className={s.hAmount}>{p.amount} ₽</span>
                    <span className={`${s.hStatus} ${cls}`}>{text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* МОК ЧЕКАУТ — модалка оплаты */}
      {checkout && (
        <div className={s.overlay} onClick={() => !processing && setCheckout(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalIcon}>💳</div>
            <div className={s.modalTitle}>Подтверди оплату</div>
            <div className={s.modalSub}>
              Это мок-оплата для демонстрации.<br />
              Нажми "Оплатить" чтобы получить звёзды.
            </div>

            <div className={s.modalDetails}>
              <div className={s.modalDetailRow}>
                <span className={s.modalDetailLabel}>Пакет</span>
                <span className={s.modalDetailVal}>
                  {packages.find((p) => p.id === checkout.package_id)?.title ?? `#${checkout.package_id}`}
                </span>
              </div>
              <div className={s.modalDetailRow}>
                <span className={s.modalDetailLabel}>Звёзды</span>
                <span className={`${s.modalDetailVal} ${s.purple}`}>
                  +{checkout.stars} ⭐
                </span>
              </div>
              <div className={s.modalDetailRow}>
                <span className={s.modalDetailLabel}>Сумма</span>
                <span className={s.modalDetailVal}>{checkout.amount} ₽</span>
              </div>
              <div className={s.modalDetailRow}>
                <span className={s.modalDetailLabel}>ID платежа</span>
                <span className={s.modalDetailVal} style={{ color: "var(--muted)", fontSize: 12 }}>
                  #{checkout.payment_id}
                </span>
              </div>
            </div>

            <div className={s.modalBtns}>
              <button
                className={s.btnCancel}
                disabled={processing}
                onClick={handleCancel}
              >
                Отменить
              </button>
              <button
                className={s.btnConfirm}
                disabled={processing}
                onClick={handleConfirm}
              >
                {processing ? "Обрабатываем..." : "Оплатить →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* УСПЕШНАЯ ОПЛАТА */}
      {success && (
        <div className={s.overlay} onClick={closeSuccess}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.successIcon}>🎉</div>
            <div className={s.modalTitle}>Оплата прошла!</div>
            <div className={s.modalSub}>
              Твой баланс пополнен на{" "}
              <strong style={{ color: "var(--purple)" }}>
                +{success.stars} ⭐
              </strong>
            </div>
            <div className={s.modalDetails}>
              <div className={s.modalDetailRow}>
                <span className={s.modalDetailLabel}>Новый баланс</span>
                <span className={`${s.modalDetailVal} ${s.purple}`}>
                  {user?.stars ?? 0} ⭐
                </span>
              </div>
            </div>
            <button className={s.btnClose} onClick={closeSuccess}>
              Отлично! →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}