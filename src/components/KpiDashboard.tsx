"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type KpiDashboardFile,
  type BusinessMetric,
  type DisciplineIndicator,
  fetchKpiDashboard,
} from "@/lib/kpi-dashboard";

const PASSWORD = "9822";
const STORE_KEY = "feixue-kpi-unlocked";

/* ───────── 集客经营板块 ───────── */

function NodeBar({ m }: { m: BusinessMetric }) {
  const max = m.annualTarget;
  const curW = Math.min(100, (m.currentCumulative / max) * 100);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          opacity: 0.6,
          marginBottom: 6,
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        <span>年度目标 {m.annualTarget} 万</span>
        <span>
          {m.quarterlyNodes.map((n, i) => (
            <span key={i} style={{ marginLeft: 10 }}>
              Q{i + 1}:{n}
            </span>
          ))}
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: 14,
          borderRadius: 7,
          background: "var(--surface-2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${curW}%`,
            height: "100%",
            borderRadius: 7,
            background:
              m.quarterRate >= 0.95 ? "#4ade80" : m.quarterRate >= 0.8 ? "#eab308" : "#f87171",
          }}
        />
        {m.quarterlyNodes.map((n, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(n / max) * 100}%`,
              top: 0,
              bottom: 0,
              width: 2,
              background: "rgba(255,255,255,0.55)",
            }}
            title={`Q${i + 1} 节点：${n}万`}
          />
        ))}
      </div>
    </div>
  );
}

function BusinessMetricCard({ m }: { m: BusinessMetric }) {
  const status = m.quarterRate >= 0.95 ? "达标" : m.quarterRate >= 0.8 ? "接近" : "落后";
  const statusColor =
    status === "达标" ? "#4ade80" : status === "接近" ? "#eab308" : "#f87171";
  return (
    <div className="card-quiet card-pad" style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
        <h4 className="section-title" style={{ margin: 0, fontSize: "1rem" }}>
          {m.name}
          <span style={{ fontSize: "0.75rem", opacity: 0.55, marginLeft: 8 }}>权重 {m.weight} 分</span>
        </h4>
        <span style={{ fontSize: "0.75rem", padding: "2px 10px", borderRadius: 99, border: `1px solid ${statusColor}`, color: statusColor }}>
          {status}（序时 {m.quarterNode}）
        </span>
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.1 }}>
            {m.currentCumulative}
            <span style={{ fontSize: "0.8125rem", fontWeight: 400, opacity: 0.6, marginLeft: 4 }}>{m.unit}</span>
          </div>
          <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{m.currentMonth} 累计（折算）</div>
        </div>
        <div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.1, color: statusColor }}>
            {Math.round(m.currentRate * 100)}%
          </div>
          <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>年度完成率</div>
        </div>
        <div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.1 }}>
            {m.score.toFixed(1)}
            <span style={{ fontSize: "0.8125rem", fontWeight: 400, opacity: 0.6, marginLeft: 4 }}>/ {m.weight}</span>
          </div>
          <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>当前得分</div>
        </div>
        <div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.1 }}>{m.augTarget}万</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>8月折算目标</div>
        </div>
      </div>
      <NodeBar m={m} />
      <p className="item-body" style={{ margin: 0, fontSize: "0.8125rem", opacity: 0.7 }}>
        {m.note}
      </p>
    </div>
  );
}

function BusinessSection({ data }: { data: KpiDashboardFile["sections"]["business"] }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          borderRadius: 10,
          background: "var(--surface-1)",
          border: "1px solid var(--border-soft)",
        }}
      >
        <span style={{ fontSize: "0.875rem", opacity: 0.75 }}>年度得分预估（当前累计口径，满分100）</span>
        <span style={{ fontSize: "1.7rem", fontWeight: 700, lineHeight: 1.1 }}>
          {data.scoreNow.toFixed(1)}
          <span style={{ fontSize: "0.875rem", opacity: 0.6, marginLeft: 4 }}>/ {data.scoreFull}</span>
        </span>
      </div>

      {data.metrics.map((m) => (
        <BusinessMetricCard key={m.key} m={m} />
      ))}

      <div style={{ display: "grid", gap: 8 }}>
        <h4 className="section-title" style={{ margin: 0, fontSize: "0.9375rem" }}>
          收官冲刺场景（8-12月）
        </h4>
        {data.scenarios.map((s) => (
          <div
            key={s.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              padding: "8px 10px",
              borderRadius: 8,
              background: "var(--surface-1)",
              border: "1px solid var(--border-soft)",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "0.875rem", minWidth: 90 }}>{s.name}</span>
            <span style={{ fontSize: "0.8125rem", opacity: 0.75 }}>
              合同再签 {s.contractNeed ?? "—"} 万（月均 {s.contractMonthly ?? "—"}）
            </span>
            <span style={{ fontSize: "0.8125rem", opacity: 0.75 }}>
              收款再收 {s.receiptNeed ?? "—"} 万（月均 {s.receiptMonthly ?? "—"}）
            </span>
            <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>{s.total} 分</span>
          </div>
        ))}
      </div>

      {data.warnings.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: 6,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(248,113,113,0.4)",
            background: "rgba(248,113,113,0.06)",
          }}
        >
          {data.warnings.map((w, i) => (
            <p key={i} style={{ margin: 0, fontSize: "0.8125rem", color: "#f87171", lineHeight: 1.5 }}>
              ⚠ {w}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ───────── 科创板块 ───────── */

function InnovationSection({ data }: { data: KpiDashboardFile["sections"]["innovation"] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          background: "var(--surface-1)",
          border: "1px solid var(--border-soft)",
        }}
      >
        <p className="item-body" style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.6 }}>
          <strong>KCI 框架：</strong>
          {data.kciFramework.note} · 节奏：{data.kciFramework.reviewCycle}
        </p>
      </div>

      {data.kpi.map((k) => {
        const isDeduct = k.type.includes("扣分");
        return (
          <div key={k.key} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--surface-1)", border: "1px solid var(--border-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <strong style={{ fontSize: "0.9375rem" }}>{k.name}</strong>
              <span
                style={{
                  fontSize: "0.6875rem",
                  padding: "2px 10px",
                  borderRadius: 99,
                  border: `1px solid ${isDeduct ? "#fbbf24" : "var(--border-soft)"}`,
                  color: isDeduct ? "#fbbf24" : "inherit",
                  opacity: 0.85,
                }}
              >
                {k.type}
              </span>
            </div>
            <p className="item-body" style={{ margin: "6px 0 0", fontSize: "0.8125rem", opacity: 0.65, lineHeight: 1.55 }}>
              {k.rule}
              {k.progressNote ? ` · ${k.progressNote}` : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ───────── 纪检板块 ───────── */

function DiscIndicatorRow({ it }: { it: DisciplineIndicator }) {
  const rate = it.max > 0 ? Math.min(1, it.prev / it.max) : 1;
  const color = it.isBonus ? "#60a5fa" : rate >= 0.95 ? "#4ade80" : rate >= 0.75 ? "#eab308" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: "0.8125rem" }}>
      <span style={{ flex: 1, opacity: 0.85, lineHeight: 1.45 }}>{it.criterion}</span>
      <div style={{ width: 56, height: 6, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ width: `${rate * 100}%`, height: "100%", borderRadius: 3, background: color }} />
      </div>
      <span style={{ width: 64, textAlign: "right", opacity: 0.65, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
        {it.prev}/{it.max || "扣"}
      </span>
    </div>
  );
}

function DisciplineSection({ data }: { data: KpiDashboardFile["sections"]["discipline"] }) {
  const totalMax = data.indicatorGroups.reduce(
    (s, g) => s + g.items.filter((i) => !i.isDeduct).reduce((x, i) => x + (i.max || 0), 0),
    0,
  );
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          borderRadius: 10,
          background: "var(--surface-1)",
          border: "1px solid var(--border-soft)",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <span style={{ fontSize: "0.8125rem", opacity: 0.7 }}>
          细则满分 {totalMax}（含正面清单） · 在手任务 {data.tasks.length} 条
        </span>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.1, color: "#60a5fa" }}>
            {data.prevScore}
          </span>
          <span style={{ fontSize: "0.75rem", opacity: 0.6, marginLeft: 4 }}>
            {data.yearPrev} 实得
          </span>
        </div>
      </div>

      {data.indicatorGroups.map((g) => (
        <div key={g.group} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--surface-1)", border: "1px solid var(--border-soft)" }}>
          <h4 className="section-title" style={{ margin: "0 0 8px", fontSize: "0.9375rem" }}>
            {g.group}
          </h4>
          {g.items.map((it, i) => (
            <DiscIndicatorRow key={i} it={it} />
          ))}
        </div>
      ))}

      {/* 重点工作 */}
      <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--surface-1)", border: "1px solid var(--border-soft)" }}>
        <h4 className="section-title" style={{ margin: "0 0 8px", fontSize: "0.9375rem" }}>
          重点工作台账
        </h4>
        <div style={{ display: "grid", gap: 6 }}>
          {data.tasks.map((t, i) => {
            const done = t.status === "已完成";
            const overdue = t.status === "逾期";
            const dotColor = done ? "#4ade80" : overdue ? "#f87171" : "#eab308";
            return (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: "0.8125rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0, alignSelf: "center" }} />
                <span style={{ flex: 1, opacity: 0.85, lineHeight: 1.45 }}>
                  {t.content}
                  {t.progress ? <span style={{ opacity: 0.55, fontSize: "0.75rem" }}>（{t.progress}）</span> : null}
                </span>
                <span style={{ opacity: 0.5, flexShrink: 0, fontSize: "0.75rem" }}>{t.deadline}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────── 主卡片 ───────── */

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);

  const tryUnlock = useCallback(() => {
    if (input.trim() === PASSWORD) {
      try {
        sessionStorage.setItem(STORE_KEY, "1");
      } catch {
        // 忽略
      }
      onUnlock();
    } else {
      setWrong(true);
    }
  }, [input, onUnlock]);

  return (
    <div style={{ maxWidth: 380, margin: "0 auto", textAlign: "center" }}>
      <p className="item-body" style={{ marginTop: 0 }}>
        看板需密码查看
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="password"
          inputMode="numeric"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") tryUnlock();
          }}
          placeholder="输入密码"
          aria-label="看板密码"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(128,128,128,0.35)",
            background: "transparent",
            color: "inherit",
            fontSize: "0.9375rem",
          }}
        />
        <button type="button" className="btn btn-primary" onClick={tryUnlock}>
          查看
        </button>
      </div>
      {wrong ? (
        <p style={{ color: "#f87171", fontSize: "0.8125rem", margin: "10px 0 0" }}>密码不对，再试一次</p>
      ) : null}
    </div>
  );
}

export function KpiDashboardCard() {
  const [unlocked, setUnlocked] = useState(true);
  const [data, setData] = useState<KpiDashboardFile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORE_KEY) === "1") setUnlocked(true);
    } catch {
      // 忽略
    }
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    const ac = new AbortController();
    fetchKpiDashboard(ac.signal)
      .then((d) => {
        if (!ac.signal.aborted) setData(d);
      })
      .catch((e) => {
        if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "看板加载失败");
      });
    return () => ac.abort();
  }, [unlocked]);

  const sectionHeader = (icon: string, name: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 10px" }}>
      <span style={{ fontSize: "1.125rem" }}>{icon}</span>
      <h3 className="section-title" style={{ margin: 0, fontSize: "1.0625rem" }}>
        {name}
      </h3>
    </div>
  );

  return (
    <div className="card-quiet card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          指标看板
        </h2>
        {data ? (
          <span style={{ fontSize: "0.75rem", opacity: 0.55 }}>
            {data.owner} · 更新于{" "}
            {new Date(data.generatedAt).toLocaleString("zh-CN", {
              hour12: false,
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        ) : null}
      </div>

      {!unlocked ? (
        <Gate onUnlock={() => setUnlocked(true)} />
      ) : error ? (
        <div className="note">看板加载失败（{error}）。</div>
      ) : !data ? (
        <p className="item-body">加载中…</p>
      ) : (
        <>
          {sectionHeader(data.sections.business.icon, data.sections.business.name)}
          <BusinessSection data={data.sections.business} />

          {sectionHeader(data.sections.innovation.icon, data.sections.innovation.name)}
          <InnovationSection data={data.sections.innovation} />

          {sectionHeader(data.sections.discipline.icon, data.sections.discipline.name)}
          <DisciplineSection data={data.sections.discipline} />

          <p className="item-body" style={{ fontSize: "0.6875rem", opacity: 0.4, margin: "16px 0 0", lineHeight: 1.5 }}>
            {data.note} · 安全生产板块待接入
          </p>
        </>
      )}
    </div>
  );
}
