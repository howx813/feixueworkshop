import type { Metadata } from "next";
import Link from "next/link";
import { changelog } from "@/data/changelog";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "更新日志",
  description: `${site.name}更新日志：版本变更、功能新增与问题修复记录。`,
};

function tagClass(tag?: string) {
  switch (tag) {
    case "新增":
      return "chip chip-accent";
    case "优化":
      return "chip";
    case "修复":
      return "chip chip-rose";
    case "文档":
      return "chip chip-amber";
    default:
      return "chip";
  }
}

export default function ChangelogPage() {
  return (
    <div className="page">
      <p className="page-kicker">Changelog</p>
      <h1 className="page-title">更新日志</h1>
      <p className="page-desc">
        记录飞雪工坊上线以来的版本变更。新功能、体验优化与缺陷修复都写在这里。
      </p>

      <div className="day-bar">
        <strong>共 {changelog.length} 个版本</strong>
        <span>最新 {changelog[0]?.version}</span>
      </div>

      <div className="list-stack">
        {changelog.map((entry, index) => (
          <article key={entry.version} className="card card-pad">
            <div className="meta-row">
              <span className={`score-pill ${index === 0 ? "score-high" : "score-mid"}`}>
                {entry.version}
              </span>
              {index === 0 ? <span className="chip chip-accent">最新</span> : null}
              <span>{entry.date}</span>
            </div>
            <h2 className="item-title" style={{ fontSize: "1.0625rem" }}>
              {entry.title}
            </h2>
            <p className="item-body">{entry.summary}</p>
            <ul className="changelog-list">
              {entry.items.map((item) => (
                <li key={`${entry.version}-${item.text}`}>
                  {item.tag ? (
                    <span className={tagClass(item.tag)}>{item.tag}</span>
                  ) : null}
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="card-quiet card-pad" style={{ marginTop: 24 }}>
        <h2 className="item-title" style={{ marginTop: 0 }}>
          如何补充日志
        </h2>
        <p className="item-body">
          发版时在 <code className="inline-code">src/data/changelog.ts</code>{" "}
          顶部追加一条版本记录即可，页面会自动展示。
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          <Link href="/" className="btn btn-ghost">
            回首页
          </Link>
          <a
            className="btn btn-primary"
            href="https://github.com/howx813/feixueworkshop"
            target="_blank"
            rel="noreferrer"
          >
            查看仓库
          </a>
        </div>
      </div>
    </div>
  );
}
