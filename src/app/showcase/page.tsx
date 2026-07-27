import type { Metadata } from "next";
import Link from "next/link";
import { capabilities, showcases, site } from "@/data/content";

export const metadata: Metadata = {
  title: "能力展厅",
  description: `${site.name}能力与作品展厅：数据智能、智能体提效、科创方法。`,
};

export default function ShowcasePage() {
  return (
    <div className="page">
      <p className="page-kicker">Showcase</p>
      <h1 className="page-title">能力展厅</h1>
      <p className="page-desc">
        可讲解的能力与作品切片。每项尽量回答三件事：解决什么问题、做到哪一步、下一步怎么演进。
      </p>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">能力地图</h2>
          <span className="section-meta">{capabilities.length} 项</span>
        </div>
        <div className="list-stack">
          {capabilities.map((cap, index) => (
            <article key={cap.id} className="card card-pad">
              <div className="meta-row">
                <span className="score-pill">
                  CAP-{String(index + 1).padStart(2, "0")}
                </span>
                <span className="chip chip-accent">{cap.status}</span>
                {cap.tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
              <h3 className="item-title">
                {cap.title}
                <span style={{ color: "var(--text-2)", fontWeight: 500 }}>
                  {" "}
                  · {cap.subtitle}
                </span>
              </h3>
              <p className="item-body">{cap.summary}</p>
              <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
                {cap.points.map((point) => (
                  <div key={point} className="bullet">
                    {point}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">作品切片</h2>
          <span className="section-meta">手搓宝匣 · 点开就能玩</span>
        </div>
        <div className="list-stack">
          {showcases.map((item, i) => (
            <article key={item.id} className="card card-pad">
              <div className="meta-row">
                <span className={`score-pill ${i === 0 ? "score-high" : "score-mid"}`}>
                  {82 - i * 5}
                </span>
                <span className="chip">{item.role}</span>
                <span>{item.stage}</span>
              </div>
              <h3 className="item-title">
                {item.href ? (
                  <Link href={item.href} className="link-accent">
                    {item.title}
                  </Link>
                ) : (
                  item.title
                )}
              </h3>
              <p className="item-body">{item.summary}</p>
              <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
                {item.highlights.map((h) => (
                  <div key={h} className="bullet">
                    {h}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                {item.stack.map((s) => (
                  <span key={s} className="tag">
                    {s}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 28 }}>
        <Link href="/insights/" className="btn btn-primary">
          去看观点
        </Link>
        <Link href="/#contact" className="btn btn-ghost">
          预约交流
        </Link>
      </div>
    </div>
  );
}
