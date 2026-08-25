"use client";

import { useCallback, useEffect, useState } from "react";
import { WeeklyReport } from "@/components/WeeklyReport";
import { KeyWorkCard } from "@/components/KeyWork";
import { KpiDashboardCard } from "@/components/KpiDashboard";
import { DataLabelingCard } from "@/components/DataLabeling";

const PASSWORD = "9822";
const STORE_KEY = "feixue-dashboard-unlocked";
const TAB_KEY = "feixue-dashboard-tab";

const TABS = [
  { key: "weekly", label: "工作周报", desc: "省公司汇报格式 · 每周日更新", icon: "📄" },
  { key: "keywork", label: "重点工作安排", desc: "KPI 锚定 · 例会主持用", icon: "🎯" },
  { key: "kpi", label: "指标看板", desc: "生产经营 / 科创 / 纪检三维指标", icon: "📊" },
  { key: "labeling", label: "数据标注", desc: "专项看板 · AI 公司相关项目", icon: "🏷️" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function isTab(v: string): v is TabKey {
  return TABS.some((t) => t.key === v);
}

export default function WeeklyPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabKey | null>(null);
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORE_KEY) === "1") setUnlocked(true);
      const t = sessionStorage.getItem(TAB_KEY);
      if (t && isTab(t)) setTab(t);
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const tryUnlock = useCallback(() => {
    if (input.trim() === PASSWORD) {
      try {
        sessionStorage.setItem(STORE_KEY, "1");
      } catch {
        // ignore
      }
      setUnlocked(true);
      setWrong(false);
    } else {
      setWrong(true);
    }
  }, [input]);

  const open = useCallback((t: TabKey) => {
    setTab(t);
    try {
      sessionStorage.setItem(TAB_KEY, t);
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0 });
  }, []);

  const back = useCallback(() => {
    setTab(null);
    try {
      sessionStorage.removeItem(TAB_KEY);
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0 });
  }, []);

  if (!ready) return null;

  // 1. 密码门
  if (!unlocked) {
    return (
      <div className="card-quiet card-pad" style={{ maxWidth: 420, margin: "48px auto 0", textAlign: "center" }}>
        <p style={{ fontSize: "2rem", margin: 0 }}>🔒</p>
        <h1 className="page-title" style={{ marginTop: 8 }}>工作看板</h1>
        <p className="page-desc" style={{ marginTop: 4 }}>周报 · 重点工作 · 指标 · 数据标注</p>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") tryUnlock();
            }}
            placeholder="输入密码"
            aria-label="工作看板密码"
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 10,
              border: wrong ? "1px solid rgba(248,113,113,0.6)" : "1px solid rgba(128,128,128,0.35)",
              background: "transparent",
              color: "inherit",
              fontSize: "1rem",
              textAlign: "center",
              letterSpacing: "0.3em",
            }}
          />
          <button type="button" className="btn btn-primary" onClick={tryUnlock}>
            进入
          </button>
        </div>
        {wrong ? (
          <p style={{ color: "#f87171", fontSize: "0.8125rem", margin: "10px 0 0" }}>密码不对，再试一次</p>
        ) : null}
      </div>
    );
  }

  // 3. 板块视图（带返回）
  if (tab) {
    const current = TABS.find((t) => t.key === tab);
    return (
      <div className="page">
        <button
          type="button"
          onClick={back}
          className="btn btn-primary"
          style={{ padding: "6px 14px", fontSize: "0.875rem", marginBottom: 16 }}
        >
          ← 返回工作看板
        </button>
        <h1 className="page-title" style={{ marginTop: 4 }}>
          {current?.icon} {current?.label}
        </h1>
        <p className="page-desc">{current?.desc}</p>
        <div style={{ marginTop: 16 }}>
          {tab === "weekly" && <WeeklyReport />}
          {tab === "keywork" && <KeyWorkCard />}
          {tab === "kpi" && <KpiDashboardCard />}
          {tab === "labeling" && <DataLabelingCard />}
        </div>
      </div>
    );
  }

  // 2. 四卡片导航页
  return (
    <div className="page">
      <p className="page-kicker">Dashboard</p>
      <h1 className="page-title">工作看板</h1>
      <p className="page-desc">点击进入对应板块</p>
      <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => open(t.key)}
            style={{
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 16,
              width: "100%",
              padding: "18px 20px",
              borderRadius: 14,
              background: "var(--surface-1)",
              border: "1px solid var(--border-soft)",
              color: "inherit",
              font: "inherit",
            }}
          >
            <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>{t.icon}</span>
            <span style={{ flex: 1 }}>
              <strong style={{ fontSize: "1.0625rem", display: "block" }}>{t.label}</strong>
              <span style={{ fontSize: "0.8125rem", opacity: 0.55 }}>{t.desc}</span>
            </span>
            <span style={{ opacity: 0.35, fontSize: "1.25rem", flexShrink: 0 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
