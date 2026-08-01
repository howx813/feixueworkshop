"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type TenderTrendsFile,
  fetchTenderTrends,
  formatWan,
} from "@/lib/tender-trends";

type Props = {
  initial: TenderTrendsFile;
};

const C_NEW = "#34d399";
const C_ACTIVE = "#60a5fa";
const C_EXPIRED = "#9ca3af";

function WeeklyChart({ data }: { data: TenderTrendsFile }) {
  const weeks = data.weekly;
  if (!weeks.length) return null;
  const max = Math.max(
    1,
    ...weeks.flatMap((w) => [w.newCount, w.activeCount, w.expiredCount]),
  );
  const W = 640;
  const H = 190;
  const padL = 28;
  const padB = 30;
  const padT = 14;
  const plotW = W - padL - 8;
  const plotH = H - padT - padB;
  const groupW = plotW / weeks.length;
  const barW = Math.min(18, (groupW - 14) / 3);
  const y = (v: number) => padT + plotH - (v / max) * plotH;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label="近 12 周标讯三态走势"
    >
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line
            x1={padL}
            x2={W - 8}
            y1={padT + plotH * (1 - f)}
            y2={padT + plotH * (1 - f)}
            stroke="currentColor"
            strokeOpacity={0.12}
          />
          <text
            x={padL - 6}
            y={padT + plotH * (1 - f) + 4}
            textAnchor="end"
            fontSize={10}
            fill="currentColor"
            fillOpacity={0.55}
          >
            {Math.round(max * f)}
          </text>
        </g>
      ))}
      {weeks.map((w, i) => {
        const gx = padL + i * groupW + (groupW - barW * 3 - 8) / 2;
        const bars: [number, string, string][] = [
          [w.newCount, C_NEW, "新增"],
          [w.activeCount, C_ACTIVE, "在途"],
          [w.expiredCount, C_EXPIRED, "出窗"],
        ];
        return (
          <g key={w.week}>
            {bars.map(([v, color, name], j) => (
              <rect
                key={name}
                x={gx + j * (barW + 4)}
                y={y(v)}
                width={barW}
                height={Math.max(1, padT + plotH - y(v))}
                rx={2}
                fill={color}
                fillOpacity={0.9}
              >
                <title>{`${w.week} ${name} ${v}`}</title>
              </rect>
            ))}
            <text
              x={padL + i * groupW + groupW / 2}
              y={H - 16}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.6}
            >
              {w.week.slice(4)}
            </text>
            <text
              x={padL + i * groupW + groupW / 2}
              y={H - 4}
              textAnchor="middle"
              fontSize={9}
              fill="currentColor"
              fillOpacity={0.45}
            >
              {w.fiveStarCount > 0 ? `5★${w.fiveStarCount} · ` : ""}
              {formatWan(w.totalMoneyWan)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function BarRows({
  rows,
  color,
  nameKey,
}: {
  rows: { label: string; count: number; hint?: string }[];
  color: string;
  nameKey: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((r) => (
        <div
          key={`${nameKey}-${r.label}`}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 9.5em) 1fr auto",
            gap: 10,
            alignItems: "center",
            fontSize: "0.8125rem",
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              opacity: 0.85,
            }}
            title={r.label}
          >
            {r.label}
          </span>
          <span
            style={{
              height: 10,
              borderRadius: 5,
              background: "currentColor",
              opacity: 0.08,
              position: "relative",
              display: "block",
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: 0,
                width: `${(r.count / max) * 100}%`,
                borderRadius: 5,
                background: color,
                opacity: 0.85,
              }}
            />
          </span>
          <span style={{ opacity: 0.75, fontVariantNumeric: "tabular-nums" }}>
            {r.count}
            {r.hint ? ` · ${r.hint}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TenderTrends({ initial }: Props) {
  const [data, setData] = useState<TenderTrendsFile>(initial);
  const [status, setStatus] = useState<"idle" | "refreshing" | "error">("idle");

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setStatus("refreshing");
    try {
      const next = await fetchTenderTrends(signal);
      if (signal?.aborted) return;
      if (next?.weekly) {
        setData(next);
        setStatus("idle");
      } else {
        throw new Error("趋势数据格式异常");
      }
    } catch {
      if (signal?.aborted) return;
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    // 构建期 JSON 作首屏；挂载后再拉 /data/tender-trends.json（方案 C 热更新）
    void refresh(ac.signal);
    return () => ac.abort();
  }, [refresh]);

  const { totals } = data;
  if (!totals || totals.tracked === 0) {
    return (
      <div className="card-quiet card-pad" style={{ marginBottom: 24 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          标讯趋势
        </h2>
        <p className="item-body">
          历史库尚未初始化。每日同步（
          <code style={{ fontSize: "0.9em" }}>npm run tenders:sync</code>
          ）后运行{" "}
          <code style={{ fontSize: "0.9em" }}>npm run tenders:aggregate</code>
          即可生成趋势。
        </p>
      </div>
    );
  }

  const health = data.syncHealth.slice(-14);
  const sparse = data.weekly.length < 2;

  return (
    <div className="card-quiet card-pad" style={{ marginBottom: 24 }}>
      <div className="day-bar" style={{ marginTop: 0 }}>
        <strong>标讯趋势</strong>
        <span>
          跟踪 {totals.tracked} · 在途 {totals.active} · 出窗 {totals.expired}
        </span>
        <span>
          历史自 {data.historyFrom || "—"} · 数据截至 {data.dataAsOf || "—"}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: "4px 10px", fontSize: "0.8125rem" }}
          onClick={() => void refresh()}
          disabled={status === "refreshing"}
        >
          {status === "refreshing" ? "刷新中…" : "刷新趋势"}
        </button>
      </div>

      {status === "error" ? (
        <div className="note" style={{ marginBottom: 12 }}>
          趋势热更新失败，仍展示构建期数据。
        </div>
      ) : null}

      {health.length ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            margin: "4px 0 14px",
            fontSize: "0.75rem",
            opacity: 0.8,
          }}
        >
          <span>每日同步</span>
          {health.map((h) => (
            <span
              key={h.date}
              title={`${h.date} ${h.ok ? "成功" : "失败"}`}
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: h.ok ? C_NEW : "#f87171",
                display: "inline-block",
              }}
            />
          ))}
          <span style={{ opacity: 0.7 }}>{health[health.length - 1]?.date}</span>
        </div>
      ) : null}

      {sparse ? (
        <div className="note" style={{ marginBottom: 12 }}>
          历史数据自 {data.historyFrom} 起积累，趋势随每日同步增长；当前{" "}
          {data.weekly.length} 周。
        </div>
      ) : null}

      <h3 className="section-title" style={{ fontSize: "1rem" }}>
        近 12 周三态走势
      </h3>
      <WeeklyChart data={data} />
      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: "0.75rem",
          margin: "4px 0 18px",
          opacity: 0.8,
        }}
      >
        <span style={{ color: C_NEW }}>■ 新增（首见在本周）</span>
        <span style={{ color: C_ACTIVE }}>■ 在途（本周内见到）</span>
        <span style={{ color: C_EXPIRED }}>■ 出窗（末见在本周且已离窗）</span>
      </div>

      <div
        style={{
          display: "grid",
          gap: 22,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <section>
          <h3 className="section-title" style={{ fontSize: "1rem" }}>
            地域分布
          </h3>
          <BarRows
            nameKey="city"
            color={C_ACTIVE}
            rows={data.byCity
              .slice(0, 8)
              .map((c) => ({ label: c.name, count: c.count }))}
          />
        </section>
        <section>
          <h3 className="section-title" style={{ fontSize: "1rem" }}>
            行业分布
          </h3>
          <BarRows
            nameKey="prof"
            color={C_NEW}
            rows={data.byProfession
              .slice(0, 8)
              .map((p) => ({ label: p.name, count: p.count }))}
          />
          <p
            className="item-body"
            style={{ fontSize: "0.75rem", opacity: 0.6, margin: "8px 0 0" }}
          >
            口径：一条标讯可属多个行业，按出现次数计，合计 ≠ 条目总数。
          </p>
        </section>
        <section>
          <h3 className="section-title" style={{ fontSize: "1rem" }}>
            金额分桶
          </h3>
          <BarRows
            nameKey="money"
            color={C_EXPIRED}
            rows={data.moneyBuckets.map((b) => ({
              label: b.bucket,
              count: b.count,
            }))}
          />
        </section>
      </div>

      {data.highlights.length ? (
        <section style={{ marginTop: 22 }}>
          <h3 className="section-title" style={{ fontSize: "1rem" }}>
            高星项目（5★）
          </h3>
          <div className="list-stack" style={{ gap: 10 }}>
            {data.highlights.map((h) => (
              <div
                key={h.id}
                className="meta-row"
                style={{ alignItems: "flex-start", gap: 10 }}
              >
                <span className="chip chip-amber">5★</span>
                <span style={{ flex: 1 }}>
                  <a
                    href={h.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontWeight: 600 }}
                  >
                    {h.title}
                  </a>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      opacity: 0.65,
                      marginTop: 2,
                    }}
                  >
                    {h.city || "—"} · {formatWan(h.moneyWan)} · 首见{" "}
                    {h.firstSeenAt} · 在窗 {h.seenCount} 天
                    {h.bidDeadline ? ` · 截止 ${h.bidDeadline}` : ""}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
