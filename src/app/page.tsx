import Link from "next/link";
import { AihotSelected } from "@/components/AihotSelected";
import { ContactForm } from "@/components/ContactForm";
import {
  capabilities,
  homeDoors,
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
  const featuredShowcases = showcases.filter((s) => s.href).slice(0, 3);

  return (
    <div className="page">
      {/* —— 展厅首屏：人设 + 三入口（对标 Magic Portfolio 气质，不大改栈） —— */}
      <header className="home-hero">
        <p className="page-kicker">{site.nameEn}</p>
        <h1 className="page-title home-hero-title">{site.heroGreeting}</h1>
        <p className="page-desc home-hero-lead">{site.heroLead}</p>
        <p className="home-hero-tag">{site.slogan}</p>

        <nav className="home-doors" aria-label="主要入口">
          {homeDoors.map((door) => (
            <Link key={door.id} href={door.href} className="home-door">
              <span className="home-door-label">{door.label}</span>
              <span className="home-door-hint">{door.hint}</span>
            </Link>
          ))}
        </nav>
      </header>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">核心能力</h2>
          <Link href="/showcase/" className="link-accent">
            全部展厅 →
          </Link>
        </div>
        <div className="list-stack">
          {capabilities.map((cap, i) => (
            <article key={cap.id} className="card card-pad">
              <div className="meta-row">
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
          <h2 className="section-title">手搓切片</h2>
          <Link href="/lab/" className="link-accent">
            打开宝匣 →
          </Link>
        </div>
        <div className="list-stack">
          {featuredShowcases.map((item) => (
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
              <h3
                className="item-title"
                style={{ marginTop: 0, fontSize: "0.9375rem" }}
              >
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
          {insights.slice(0, 2).map((item) => (
            <article key={item.id} className="card card-pad">
              <div className="meta-row">
                <span className="chip chip-amber">{item.category}</span>
                <span>{item.date}</span>
              </div>
              <h3 className="item-title">{item.title}</h3>
              <p className="item-body">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">行业热点（精选）</h2>
          <span className="section-meta">可折叠关注 · 不挡展厅</span>
        </div>
        <AihotSelected limit={6} initialItems={aihotItems} />
      </section>

      <section className="section" id="contact">
        <div className="section-head">
          <h2 className="section-title">联系工坊</h2>
          <span className="section-meta">人工回复 · 1–2 个工作日</span>
        </div>
        <div className="list-stack" style={{ marginBottom: 12 }}>
          <div className="card-quiet card-pad">
            <div className="bullet">
              适合：AI 提效咨询、数据看板原型、材料方法交流
            </div>
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
