import type { Metadata } from "next";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import { site } from "@/data/content";
import { softwareQuals } from "@/data/software-quals";
import type { TendersFile } from "@/lib/tenders";
import type { AgentActivityEntry, TenderTrendsFile } from "@/lib/tender-trends";
import { TenderBoard } from "@/components/TenderBoard";
import { TenderTrends } from "@/components/TenderTrends";
import { AgentPulse } from "@/components/AgentPulse";
import tendersData from "@/data/tenders.generated.json";
import trendsData from "@/data/tender-trends.generated.json";

export const metadata: Metadata = {
  title: "每日标讯",
  description: `${site.name}每日标讯：中电信人工智能 / 电信贵州 · 卡片化分类浏览。`,
};

const initial = tendersData as TendersFile;
const trends = trendsData as TenderTrendsFile;

function latestActivity(): AgentActivityEntry | null {
  try {
    const file = path.join(process.cwd(), "data", "agent-activity.jsonl");
    const lines = fs.readFileSync(file, "utf8").split("\n").filter((l) => l.trim());
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      try {
        return JSON.parse(lines[i]) as AgentActivityEntry;
      } catch {
        // skip
      }
    }
  } catch {
    // empty
  }
  return null;
}

export default function TendersPage() {
  return (
    <div className="page tenders-page">
      <p className="page-kicker">Daily Bids</p>
      <h1 className="page-title">每日标讯</h1>
      <p className="page-desc tenders-page-desc">
        卡片浏览 · 按主体与阶段聚焦。默认中电信人工智能在投招采；中标结果含聚合分析。
      </p>

      <AgentPulse initial={latestActivity()} />

      <details className="tenders-fold">
        <summary>标讯趋势（历史跟踪）</summary>
        <div className="tenders-fold-body">
          <TenderTrends initial={trends} />
        </div>
      </details>

      <TenderBoard initial={initial} />

      <details className="tenders-fold" style={{ marginTop: 24 }}>
        <summary>匹配用公开标准关键词（参考）</summary>
        <div className="tenders-fold-body card-quiet card-pad">
          <p className="item-body" style={{ marginTop: 0 }}>
            行业常见公开资质/标准名称，仅作关键词提示，不代表持证情况。
          </p>
          <div className="tender-qual-ref">
            {softwareQuals.map((q) => (
              <div key={q.id} className="tender-qual-ref-row">
                <span className="chip">{q.domain}</span>
                <span>
                  <strong style={{ fontWeight: 650 }}>{q.name}</strong>
                  <span style={{ opacity: 0.7 }}> — {q.useCase}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </details>

      <div style={{ marginTop: 18 }}>
        <Link href="/" className="btn btn-ghost">
          返回首页
        </Link>
      </div>
    </div>
  );
}
