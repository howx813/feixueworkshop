"use client";

import { useState } from "react";
import {
  type CtaAiAwardAnalysis as Analysis,
  type TenderItem,
  analyzeCtaAiAwards,
  formatTenderMoney,
} from "@/lib/tenders";

type Props = {
  items: TenderItem[];
  /** 默认折叠，只显示摘要条 */
  compact?: boolean;
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
        暂无解析到中标人
      </p>
    );
  }
  return (
    <ul className="cta-award-bars">
      {winners.slice(0, 6).map((w) => (
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

export function CtaAiAwardAnalysisPanel({ items, compact = true }: Props) {
  const analysis = analyzeCtaAiAwards(items);
  const [open, setOpen] = useState(!compact);
  if (analysis.total === 0) return null;

  const maxWinnerCount = Math.max(1, ...analysis.winners.map((w) => w.count));
  const moneyLabel =
    analysis.withMoney > 0 ? formatTenderMoney(analysis.totalMoneyWan) : "金额少";
  const topWinner = analysis.winners[0]?.name;

  return (
    <section className="cta-award-panel cta-award-compact" aria-label="中标公示分析">
      <button
        type="button"
        className="cta-award-summary"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="chip chip-accent">中标分析</span>
        <span className="cta-award-summary-text">
          去重 {analysis.uniqueProjects} 项 · 合计 {moneyLabel}
          {topWinner ? ` · 频次首位 ${topWinner}` : ""}
        </span>
        <span className="cta-award-toggle">{open ? "收起" : "展开"}</span>
      </button>

      {open ? (
        <div className="cta-award-body card-pad">
          <div className="cta-award-stats">
            <Stat
              label="去重项目"
              value={String(analysis.uniqueProjects)}
              sub={`原始 ${analysis.total} 条`}
            />
            <Stat
              label="金额合计"
              value={analysis.withMoney > 0 ? moneyLabel : "—"}
              sub={
                analysis.withMoney > 0
                  ? `${analysis.withMoney} 个有金额`
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
              sub={`中标人 ${analysis.withWinner}/${analysis.uniqueProjects}`}
            />
            <Stat
              label="主题 TOP"
              value={analysis.themes[0]?.theme || "—"}
              sub={analysis.themes
                .slice(0, 3)
                .map((t) => `${t.theme}${t.count}`)
                .join(" · ")}
            />
          </div>

          {analysis.insights[0] ? (
            <p className="item-body cta-award-one-insight">{analysis.insights[0]}</p>
          ) : null}

          <div className="cta-award-grid">
            <div>
              <div className="tender-keylabel" style={{ marginBottom: 8 }}>
                中标人榜
              </div>
              <WinnerBar winners={analysis.winners} maxCount={maxWinnerCount} />
            </div>
            <div>
              <div className="tender-keylabel" style={{ marginBottom: 8 }}>
                主题
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {analysis.themes.map((t) => (
                  <span key={t.theme} className="chip">
                    {t.theme}
                    <span style={{ opacity: 0.75, marginLeft: 4 }}>{t.count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="tender-keylabel" style={{ marginBottom: 6 }}>
              近期明细
            </div>
            <div className="cta-award-table-wrap">
              <table className="cta-award-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>项目</th>
                    <th>中标人</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.recent.slice(0, 8).map((row) => {
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
                            {shortTitle(row.title).slice(0, 36)}
                            {shortTitle(row.title).length > 36 ? "…" : ""}
                          </a>
                        </td>
                        <td>{row.winner || "—"}</td>
                        <td className="cta-award-td-money">
                          {money > 0 ? formatTenderMoney(money) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
