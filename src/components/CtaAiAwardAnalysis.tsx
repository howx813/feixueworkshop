"use client";

import {
  type CtaAiAwardAnalysis as Analysis,
  type TenderItem,
  analyzeCtaAiAwards,
  formatTenderMoney,
} from "@/lib/tenders";

type Props = {
  items: TenderItem[];
};

function shortTitle(title: string) {
  return title
    .replace(/中电信人工智能科技\s*（?\s*北京\s*）?\s*有限公司\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="cta-award-stat">
      <div className="tender-keylabel">{label}</div>
      <div className="cta-award-stat-value">{value}</div>
      {sub ? <div className="cta-award-stat-sub">{sub}</div> : null}
    </div>
  );
}

function WinnerBar({
  winners,
  maxCount,
}: {
  winners: Analysis["winners"];
  maxCount: number;
}) {
  if (!winners.length) {
    return (
      <p className="item-body" style={{ margin: 0, fontSize: "0.875rem" }}>
        暂无解析到中标人（部分询比/直接采购正文结构不同，见明细或原文）
      </p>
    );
  }
  return (
    <ul className="cta-award-bars">
      {winners.slice(0, 8).map((w) => (
        <li key={w.name}>
          <div className="cta-award-bar-head">
            <span className="cta-award-bar-name" title={w.name}>
              {w.name}
            </span>
            <span className="cta-award-bar-meta">
              {w.count} 次
              {w.moneyWan > 0 ? ` · ${formatTenderMoney(w.moneyWan)}` : ""}
            </span>
          </div>
          <div className="cta-award-bar-track" aria-hidden>
            <div
              className="cta-award-bar-fill"
              style={{
                width: `${Math.max(8, (w.count / Math.max(1, maxCount)) * 100)}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CtaAiAwardAnalysisPanel({ items }: Props) {
  const analysis = analyzeCtaAiAwards(items);
  if (analysis.total === 0) return null;

  const maxWinnerCount = Math.max(1, ...analysis.winners.map((w) => w.count));

  return (
    <section className="card card-pad cta-award-panel" aria-label="中电信人工智能中标公示分析">
      <div className="meta-row" style={{ marginBottom: 8 }}>
        <span className="chip chip-accent">中标分析</span>
        <span className="chip chip-amber">中电信人工智能科技</span>
        <span style={{ opacity: 0.7, fontSize: "0.8125rem" }}>
          去重项目 {analysis.uniqueProjects} · 原始公示 {analysis.total}
        </span>
      </div>
      <h2 className="item-title" style={{ marginTop: 0, fontSize: "1.0625rem" }}>
        中标公示分析
      </h2>
      <p className="item-body" style={{ marginTop: 0, marginBottom: 14, fontSize: "0.875rem" }}>
        对当前快照中「中电信人工智能科技」采购主体的中标候选人、成交候选人、询比结果与直接采购公示做聚合。金额以万元计，未披露不计入合计。
      </p>

      <div className="cta-award-stats">
        <Stat
          label="去重项目"
          value={String(analysis.uniqueProjects)}
          sub={`原始 ${analysis.total} 条`}
        />
        <Stat
          label="披露金额合计"
          value={
            analysis.withMoney > 0
              ? formatTenderMoney(analysis.totalMoneyWan)
              : "—"
          }
          sub={
            analysis.withMoney > 0
              ? `${analysis.withMoney} 个有金额 · 均 ${formatTenderMoney(analysis.avgMoneyWan)}`
              : "多数未披露"
          }
        />
        <Stat
          label="最大单笔"
          value={
            analysis.maxMoneyWan > 0
              ? formatTenderMoney(analysis.maxMoneyWan)
              : "—"
          }
          sub={`解析到中标人 ${analysis.withWinner}/${analysis.uniqueProjects}`}
        />
        <Stat
          label="公示类型"
          value={
            analysis.kindBreakdown[0]
              ? `${analysis.kindBreakdown[0].kind.replace("公示", "")}`
              : "—"
          }
          sub={analysis.kindBreakdown
            .map((k) => `${k.kind.replace(/公示$/, "")} ${k.count}`)
            .join(" · ")}
        />
      </div>

      <div className="cta-award-insights">
        {analysis.insights.map((line) => (
          <p key={line} className="item-body" style={{ margin: "0 0 6px", fontSize: "0.875rem" }}>
            · {line}
          </p>
        ))}
      </div>

      <div className="cta-award-grid">
        <div>
          <div className="tender-keylabel" style={{ marginBottom: 8 }}>
            中标人榜（按中标次数）
          </div>
          <WinnerBar winners={analysis.winners} maxCount={maxWinnerCount} />
        </div>
        <div>
          <div className="tender-keylabel" style={{ marginBottom: 8 }}>
            主题分布
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {analysis.themes.map((t) => (
              <span key={t.theme} className="chip" title={formatTenderMoney(t.moneyWan)}>
                {t.theme}
                <span style={{ opacity: 0.75, marginLeft: 6 }}>
                  {t.count}
                  {t.moneyWan > 0 ? ` · ${formatTenderMoney(t.moneyWan)}` : ""}
                </span>
              </span>
            ))}
          </div>
          {analysis.winners[0]?.projects?.length ? (
            <div style={{ marginTop: 14 }}>
              <div className="tender-keylabel" style={{ marginBottom: 6 }}>
                榜首近期项目
              </div>
              <ul className="cta-award-projlist">
                {analysis.winners[0].projects.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="tender-keylabel" style={{ marginBottom: 8 }}>
          近期中标明细
        </div>
        <div className="cta-award-table-wrap">
          <table className="cta-award-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>项目</th>
                <th>中标/成交人</th>
                <th>金额</th>
                <th>类型</th>
              </tr>
            </thead>
            <tbody>
              {analysis.recent.map((row) => {
                const money = row.awardMoneyWan || row.moneyWan || 0;
                return (
                  <tr key={row.id}>
                    <td className="cta-award-td-date">{row.date || "—"}</td>
                    <td>
                      <a
                        href={row.sourceUrl || row.platformUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={row.title}
                      >
                        {shortTitle(row.title).slice(0, 42)}
                        {shortTitle(row.title).length > 42 ? "…" : ""}
                      </a>
                    </td>
                    <td>{row.winner || "—"}</td>
                    <td className="cta-award-td-money">
                      {money > 0 ? formatTenderMoney(money) : "未披露"}
                    </td>
                    <td>
                      {(row.awardNoticeKind || row.tenderType || "中标")
                        .replace("公示", "")
                        .slice(0, 8)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
