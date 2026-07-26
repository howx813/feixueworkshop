import type { Metadata } from "next";
import Link from "next/link";
import { insights, site } from "@/data/content";

export const metadata: Metadata = {
  title: "观点精选",
  description: `${site.name}观点精选：AI、数据服务、交付方法与组织观察。`,
};

export default function InsightsPage() {
  return (
    <div className="page">
      <p className="page-kicker">Insights</p>
      <h1 className="page-title">观点精选</h1>
      <p className="page-desc">
        每条控制在「判断 + 依据方向 + 可执行结论」。不是新闻搬运，是可拿去讨论的立场。
      </p>

      <div className="day-bar">
        <strong>精选 {insights.length} 条</strong>
        <span>短结论优先</span>
      </div>

      <div className="list-stack">
        {insights.map((item, index) => (
          <article key={item.id} className="card card-pad">
            <div className="meta-row">
              <span
                className={`score-pill ${index < 2 ? "score-high" : "score-mid"}`}
              >
                {90 - index * 4}
              </span>
              <span className="chip chip-amber">{item.category}</span>
              <span>{item.date}</span>
              <span>#{String(index + 1).padStart(2, "0")}</span>
            </div>
            <h2 className="item-title" style={{ fontSize: "1.0625rem" }}>
              {item.title}
            </h2>
            <p className="item-body">{item.summary}</p>
            <div className="note">
              <strong style={{ fontWeight: 650 }}>推荐理由：</strong>
              {item.takeaway}
            </div>
          </article>
        ))}
      </div>

      <div className="card-quiet card-pad" style={{ marginTop: 24 }}>
        <h2 className="item-title" style={{ marginTop: 0 }}>
          后续计划
        </h2>
        <p className="item-body">
          v0.2 可接 Markdown 文章库或飞书文档同步，支持单篇详情页。当前先用精选卡片验证信息结构。
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          <Link href="/showcase/" className="btn btn-ghost">
            返回展厅
          </Link>
          <Link href="/#contact" className="btn btn-primary">
            交流观点
          </Link>
        </div>
      </div>
    </div>
  );
}
