import Link from "next/link";
import { AihotSelected } from "@/components/AihotSelected";
import { ContactForm } from "@/components/ContactForm";
import {
  capabilities,
  insights,
  principles,
  showcases,
  site,
} from "@/data/content";
import { fetchAihotSelected } from "@/lib/aihot";

/** 静态导出：必须强制静态，否则隔离 build 不生成 out/index.html */
export const dynamic = "force-static";

async function prefetchAihot() {
  try {
    return await fetchAihotSelected({
      mode: "selected",
      window: "7d",
      limit: 8,
      timeoutMs: 15000,
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const aihotItems = await prefetchAihot();

  return (
    <div className="page">
      <h1 className="page-title">{site.name}</h1>

      <AihotSelected limit={8} initialItems={aihotItems} />

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">核心能力 TOP {capabilities.length}</h2>
          <Link href="/showcase/" className="link-accent">
            全部展厅 →
          </Link>
        </div>
        <div className="list-stack">
          {capabilities.map((cap, i) => (
            <article key={cap.id} className="card card-pad">
              <div className="meta-row">
                <span className="score-pill score-high">{90 - i * 4}</span>
                <span className="chip chip-accent">{cap.status}</span>
                <span>{cap.tags[0]}</span>
              </div>
              <h3 className="item-title">
                {i + 1}. {cap.title}
                <span style={{ color: "var(--text-2)", fontWeight: 500 }}>
                  {" "}
                  · {cap.subtitle}
                </span>
              </h3>
              <p className="item-body">{cap.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">作品切片</h2>
          <span className="section-meta">点开就能玩 · 手搓宝匣</span>
        </div>
        <div className="list-stack">
          {showcases.map((item) => (
            <article key={item.id} className="card card-pad">
              <div className="meta-row">
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
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

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">工坊原则</h2>
        </div>
        <div className="grid-3">
          {principles.map((p) => (
            <div key={p.title} className="card-quiet card-pad">
              <h3 className="item-title" style={{ marginTop: 0, fontSize: "0.9375rem" }}>
                {p.title}
              </h3>
              <p className="item-body">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">观点精选</h2>
          <Link href="/insights/" className="link-accent">
            全部观点 →
          </Link>
        </div>
        <div className="list-stack">
          {insights.map((item, i) => (
            <article key={item.id} className="card card-pad">
              <div className="meta-row">
                <span className={`score-pill ${i < 2 ? "score-high" : "score-mid"}`}>
                  {88 - i * 3}
                </span>
                <span className="chip chip-amber">{item.category}</span>
                <span>{item.date}</span>
              </div>
              <h3 className="item-title">{item.title}</h3>
              <p className="item-body">{item.summary}</p>
              <div className="note">
                <strong style={{ fontWeight: 650 }}>推荐理由：</strong>
                {item.takeaway}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="contact">
        <div className="section-head">
          <h2 className="section-title">联系工坊</h2>
          <span className="section-meta">人工回复 · 1–2 个工作日</span>
        </div>
        <div className="list-stack" style={{ marginBottom: 12 }}>
          <div className="card-quiet card-pad">
            <div className="bullet">适合：AI 提效咨询、数据看板原型、材料方法交流</div>
            <div className="bullet" style={{ marginTop: 6 }}>
              不适合：免费代写长篇公文、无边界驻场
            </div>
          </div>
        </div>
        <ContactForm />
      </section>

      <footer
        style={{
          marginTop: 40,
          paddingTop: 16,
          borderTop: "1px solid var(--border-soft)",
          color: "var(--text-2)",
          fontSize: "0.75rem",
          lineHeight: 1.6,
        }}
      >
        © {new Date().getFullYear()} {site.owner} · {site.nameEn}
        <br />
        个人作品与方法展厅，不代表任何机构官方立场。
      </footer>
    </div>
  );
}
