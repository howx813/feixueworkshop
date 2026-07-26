import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/data/content";
import { softwareQuals } from "@/data/software-quals";
import type { TendersFile } from "@/lib/tenders";
import { TenderBoard } from "@/components/TenderBoard";
import tendersData from "@/data/tenders.generated.json";

export const metadata: Metadata = {
  title: "每日标讯",
  description: `${site.name}每日标讯：软件 / 信息化类招标线索与关键字段摘要。`,
};

const initial = tendersData as TendersFile;

export default function TendersPage() {
  return (
    <div className="page">
      <p className="page-kicker">Daily Bids</p>
      <h1 className="page-title">每日标讯</h1>
      <p className="page-desc">
        静态站点 + 定时快照：汇总软件 / 信息化类招标，按匹配星级排序；展示截止、规模、文件费与资格摘录。5
        星项目会尝试深挖公开招标附件。
      </p>

      <TenderBoard initial={initial} />

      <div className="card-quiet card-pad" style={{ marginTop: 28 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          匹配用公开标准关键词（参考）
        </h2>
        <p className="item-body">
          下列为行业常见公开资质/标准名称，仅作关键词匹配提示，不代表任何主体持证情况，也不构成投标承诺。
        </p>
        <div className="list-stack" style={{ marginTop: 14 }}>
          {softwareQuals.map((q) => (
            <div
              key={q.id}
              className="meta-row"
              style={{ alignItems: "flex-start" }}
            >
              <span className="chip">{q.domain}</span>
              <span style={{ flex: 1 }}>
                <strong style={{ fontWeight: 650 }}>{q.name}</strong>
                <span style={{ opacity: 0.75 }}> — {q.useCase}</span>
              </span>
            </div>
          ))}
        </div>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}
        >
          <Link href="/" className="btn btn-ghost">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
