import type { Metadata } from "next";
import Link from "next/link";
import { LabIcon } from "@/components/LabIcon";
import { labItems, labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: labMeta.name,
  description: `${site.name}${labMeta.name}：${labMeta.description}`,
};

function statusClass(status: string) {
  if (status === "可玩") return "chip chip-accent";
  if (status === "实验中") return "chip chip-amber";
  return "chip";
}

export default function LabPage() {
  return (
    <div className="page">
      <p className="page-kicker">{labMeta.nameEn}</p>
      <h1 className="page-title">{labMeta.name}</h1>
      <p className="page-desc">{labMeta.description}</p>

      <div className="day-bar">
        <strong>{labMeta.slogan}</strong>
        <span>共 {labItems.length} 件</span>
      </div>

      <div className="list-stack">
        {labItems.map((item, index) => (
          <Link key={item.id} href={item.href} className="card card-pad lab-card">
            <div className="meta-row">
              <span className="score-pill">{String(index + 1).padStart(2, "0")}</span>
              <span className={statusClass(item.status)}>{item.status}</span>
              <span>{item.updated}</span>
            </div>
            <h2
              className="item-title"
              style={{
                fontSize: "1.0625rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <LabIcon id={item.icon} size={20} />
              {item.title}
            </h2>
            <p className="item-body">{item.summary}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {item.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <div className="card-quiet card-pad" style={{ marginTop: 24 }}>
        <h2 className="item-title" style={{ marginTop: 0 }}>
          以后怎么加
        </h2>
        <p className="item-body">
          有灵机一动的小东西，就往匣子里塞：页面放{" "}
          <code className="inline-code">src/app/lab/…</code>，条目写在{" "}
          <code className="inline-code">src/data/lab.ts</code> 顶部。
        </p>
      </div>
    </div>
  );
}
