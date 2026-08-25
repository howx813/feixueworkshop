"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

const PASSWORD = "9822";
const STORE_KEY = "feixue-dashboard-unlocked";

/**
 * 工作看板统一密码门：输入一次 9822，页面内所有卡片解锁（sessionStorage 记住）。
 */
export function DashboardGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORE_KEY) === "1") setUnlocked(true);
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

  if (!ready) return null;

  if (unlocked) return <>{children}</>;

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
