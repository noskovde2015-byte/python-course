// src/components/home/Hero.jsx
import { Link } from "react-router-dom";
import s from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={s.hero}>
      <div className={s.left}>
        <div className={s.badge}>
          <span className={s.dot} />
          Открытая платформа · 2025
        </div>
        <h1 className={s.title}>
          Твой комфортный<br />
          старт в <em>новой</em><br />
          профессии.
        </h1>
        <p className={s.sub}>
          Новая карьера ближе чем кажется — структурированные курсы,
          реальные задачи и живое сообщество.
        </p>
        <div className={s.actions}>
          <Link to="/register" className={s.btnPrimary}>Начать заниматься →</Link>
          <Link to="/courses"  className={s.btnGhost}>Смотреть курсы</Link>
        </div>
        <div className={s.stats}>
          {[["12+","курсов"],["340+","задач"],["1.2k","студентов"]].map(([n,l]) => (
            <div key={l}>
              <div className={s.statNum}>{n}</div>
              <div className={s.statLabel}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={s.right}>
        <div className={s.glow} />
        <div className={s.window}>
          <div className={s.titlebar}>
            <span className={`${s.wdot} ${s.r}`} />
            <span className={`${s.wdot} ${s.y}`} />
            <span className={`${s.wdot} ${s.g}`} />
            <span className={s.filename}>main.py</span>
          </div>
          <div className={s.code}>
            <div className={s.line}><span className={s.ln}>1</span><span><span className={s.kw}>from</span><span className={s.tx}> fastapi </span><span className={s.kw}>import</span><span className={s.fn}> FastAPI</span></span></div>
            <div className={s.line}><span className={s.ln}>2</span><span><span className={s.kw}>from</span><span className={s.tx}> core.config </span><span className={s.kw}>import</span><span className={s.fn}> settings</span></span></div>
            <div className={s.line}><span className={s.ln}>3</span><span>&nbsp;</span></div>
            <div className={s.line}><span className={s.ln}>4</span><span><span className={s.tx}>app </span><span className={s.op}>=</span><span className={s.fn}> FastAPI</span><span className={s.tx}>()</span></span></div>
            <div className={s.line}><span className={s.ln}>5</span><span>&nbsp;</span></div>
            <div className={s.line}><span className={s.ln}>6</span><span><span className={s.dec}>@app.get</span><span className={s.tx}>(</span><span className={s.str}>"/api/courses"</span><span className={s.tx}>)</span></span></div>
            <div className={s.line}><span className={s.ln}>7</span><span><span className={s.kw}>async def</span><span className={s.fn}> get_courses</span><span className={s.tx}>():</span></span></div>
            <div className={s.line}><span className={s.ln}>8</span><span><span className={s.tx}>&nbsp;&nbsp;&nbsp;</span><span className={s.cm}># возвращаем список курсов</span></span></div>
            <div className={s.line}><span className={s.ln}>9</span><span><span className={s.tx}>&nbsp;&nbsp;&nbsp;</span><span className={s.kw}>return</span><span className={s.tx}> {"{"}</span><span className={s.str}>"courses"</span><span className={s.op}>: </span><span className={s.fn}>courses</span><span className={s.tx}>{"}"}</span></span></div>
          </div>
        </div>
      </div>
    </section>
  );
}