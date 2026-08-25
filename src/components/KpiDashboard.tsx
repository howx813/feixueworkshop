"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type KpiDashboardFile,
  type KpiMetric,
  fetchKpiDashboard,
} from "@/lib/kpi-dashboard";

const PASSWORD = "9822";
const STORE_KEY = "feixue-kpi-unlocked";

/** 季度节点阶梯进度条：当前累计 vs 各季度节点 */
function NodeBar({ m }: { m: KpiMetric }) {
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
              m.quarterRate >= 0.95
                ? "var(--accent)"
                : m.quarterRate >= 0.8
                  ? "#eab308"
                  : "#f87171",
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

function MetricCard({ m }: { m: KpiMetric }) {
  const status =
    m.quarterRate >= 0.95 ? "达标" : m.quarterRate >= 0.8 ? "接近" : "落后";
  const statusColor =
    status === "达标" ? "#4ade80" : status === "接近" ? "#eab308" : "#f87171";
  return (
    <div className="card-quiet card-pad" style={{ display: "grid", gap: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <h3 className="section-title" style={{ margin: 0, fontSize: "1.0625rem" }}>
          {m.name}
          <span style={{ fontSize: "0.75rem", opacity: 0.55, marginLeft: 8 }}>
            权重 {m.weight} 分
          </span>
        </h3>
        <span
          style={{
            fontSize: "0.75rem",
            padding: "2px 10px",
            borderRadius: 99,
            border: `1px solid ${statusColor}`,
            color: statusColor,
          }}
        >
          {status}（序时 {m.quarterNode}）
        </span>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, lineHeight: 1.1 }}>
            {m.currentCumulative}
            <span style={{ fontSize: "0.875rem", fontWeight: 400, opacity: 0.6, marginLeft: 4 }}>
              {m.unit}
            </span>
          </div>
          <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
            {m.currentMonth} 累计（折算）
          </div>
        </div>
        <div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, lineHeight: 1.1, color: statusColor }}>
            {Math.round(m.currentRate * 100)}%
          </div>
          <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>年度完成率</div>
        </div>
        <div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, lineHeight: 1.1 }}>
            {m.score.toFixed(1)}
            <span style={{ fontSize: "0.875rem", fontWeight: 400, opacity: 0.6, marginLeft: 4 }}>
              / {m.weight}
            </span>
          </div>
          <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>当前得分</div>
        </div>
        <div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, lineHeight: 1.1 }}>
            {m.augTarget}
            <span style={{ fontSize: "0.875rem", fontWeight: 400, opacity: 0.6, marginLeft: 4 }}>
              万
            </span>
          </div>
          <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>8月折算目标</div>
        </div>
      </div>

      <NodeBar m={m} />

      <p className="item-body" style={{ margin: 0, fontSize: "0.8125rem", opacity: 0.7 }}>
        {m.note} · 计分：每低1%扣{m.scoring.deductPer1pct}分，每高1%加{m.scoring.bonusPer1pct}分（上限{m.scoring.bonusCap}）
      </p>
    </div>
  );
}

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
    <div
      className="card-quiet card-pad"
      style={{ maxWidth: 380, margin: "0 auto", textAlign: "center" }}
    >
      <p className="item-body" style={{ marginTop: 0 }}>
        考核看板需密码查看
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
        <p style={{ color: "#f87171", fontSize: "0.8125rem", margin: "10px 0 0" }}>
          密码不对，再试一次
        </p>
      ) : null}
    </div>
  );
}

export function KpiDashboardCard() {
  const [unlocked, setUnlocked] = useState(false);
  const [data, setData] = useState<KpiDashboardFile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORE_KEY) === "1") setUnlocked(true);
    } catch {
      // 隐私模式等场景：每次都输密码
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
        if (!ac.signal.aborted)
          setError(e instanceof Error ? e.message : "看板加载失败");
      });
    return () => ac.abort();
  }, [unlocked]);

  return (
    <div className="card-quiet card-pad">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 12,
        }}
      >
        <h2 className="section-title" style={{ margin: 0 }}>
          副职考核指标看板
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
        <div style={{ display: "grid", gap: 14 }}>
          {/* 总分 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--surface-1)",
              border: "1px solid var(--border-soft)",
            }}
          >
            <span style={{ fontSize: "0.875rem", opacity: 0.75 }}>
              年度得分预估（当前累计口径）
            </span>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "1.9rem", fontWeight: 700, lineHeight: 1.1 }}>
                {data.scoreNow.toFixed(1)}
              </span>
              <span style={{ fontSize: "0.9375rem", opacity: 0.6, marginLeft: 4 }}>
                / {data.scoreFull}
              </span>
            </div>
          </div>

          {data.metrics.map((m) => (
            <MetricCard key={m.key} m={m} />
          ))}

          {/* 冲刺场景 */}
          <div style={{ display: "grid", gap: 8 }}>
            <h3 className="section-title" style={{ margin: 0, fontSize: "1rem" }}>
              收官冲刺场景（8-12月，5个月）
            </h3>
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
                <span style={{ fontWeight: 600, fontSize: "0.875rem", minWidth: 90 }}>
                  {s.name}
                </span>
                <span style={{ fontSize: "0.8125rem", opacity: 0.75 }}>
                  合同再签 {s.contractNeed ?? "—"} 万（月均 {s.contractMonthly ?? "—"}）
                </span>
                <span style={{ fontSize: "0.8125rem", opacity: 0.75 }}>
                  收款再收 {s.receiptNeed ?? "—"} 万（月均 {s.receiptMonthly ?? "—"}）
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>{s.total} 分</span>
              </div>
            ))}
          </div>

          {/* 其他考核项 */}
          <div style={{ display: "grid", gap: 6 }}>
            <h3 className="section-title" style={{ margin: 0, fontSize: "1rem" }}>
              其他考核条线
            </h3>
            {data.otherIndicators.map((o) => (
              <div
                key={o.name}
                style={{ display: "flex", gap: 10, fontSize: "0.8125rem", lineHeight: 1.5 }}
              >
                <span style={{ width: 130, flexShrink: 0, opacity: 0.85 }}>{o.name}</span>
                <span style={{ flex: 1, opacity: 0.65 }}>{o.desc}</span>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: "0.6875rem",
                    padding: "1px 8px",
                    borderRadius: 99,
                    border: "1px solid var(--border-soft)",
                    opacity: 0.7,
                  }}
                >
                  {o.status === "ok" ? "正常" : "跟踪中"}
                </span>
              </div>
            ))}
          </div>

          {/* 风险提示 */}
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
                <p
                  key={i}
                  style={{ margin: 0, fontSize: "0.8125rem", color: "#f87171", lineHeight: 1.5 }}
                >
                  ⚠ {w}
                </p>
              ))}
            </div>
          ) : null}

          <p className="item-body" style={{ fontSize: "0.75rem", opacity: 0.5, margin: 0 }}>
            {data.updatedNote}
          </p>
        </div>
      )}
    </div>
  );
}
