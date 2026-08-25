"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type DailyWorkFile,
  type Department,
  fetchDailyWork,
} from "@/lib/daily-work";

const PASSWORD = "9822";
const STORE_KEY = "feixue-daily-unlocked";

function DeptBlock({ d }: { d: Department }) {
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const tasks = tab === "daily" ? d.daily : d.weekly;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 10,
          background: "var(--surface-1)",
          border: "1px solid var(--border-soft)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
          <strong style={{ fontSize: "0.9375rem" }}>{d.dept}</strong>
          <span
            style={{
              fontSize: "0.75rem",
              padding: "2px 12px",
              borderRadius: 99,
              background: "rgba(96,165,250,0.15)",
              color: "#60a5fa",
              border: "1px solid rgba(96,165,250,0.3)",
            }}
          >
            责任人：{d.person}
          </span>
        </div>
        <p className="item-body" style={{ margin: "4px 0 0", fontSize: "0.75rem", opacity: 0.55 }}>
          分管范围：{d.domain}
        </p>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {(
          [
            ["daily", `每日 (${d.daily.length})`],
            ["weekly", `每周 (${d.weekly.length})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`btn ${tab === k ? "btn-primary" : ""}`}
            style={{
              padding: "5px 14px",
              fontSize: "0.8125rem",
              ...(tab === k
                ? {}
                : {
                    background: "rgba(255,255,255,.08)",
                    color: "rgba(255,255,255,.6)",
                    border: "1px solid rgba(255,255,255,.1)",
                  }),
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 5 }}>
        {tasks.map((t, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "baseline",
              padding: "7px 10px",
              borderRadius: 8,
              background: "var(--surface-1)",
              border: "1px solid var(--border-soft)",
              fontSize: "0.8125rem",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                fontSize: "0.6875rem",
                opacity: 0.55,
                minWidth: t.freq.length > 4 ? 90 : 48,
              }}
            >
              {t.freq}
            </span>
            <span style={{ flex: 1, lineHeight: 1.5, opacity: 0.85 }}>
              {t.task}
              {t.from ? (
                <span style={{ opacity: 0.5, fontSize: "0.75rem" }}>（依据：{t.from}）</span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DailyWorkCard() {
  const [unlocked, setUnlocked] = useState(false);
  const [data, setData] = useState<DailyWorkFile | null>(null);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORE_KEY) === "1") setUnlocked(true);
    } catch {
      // 忽略
    }
  }, []);

  const unlock = useCallback(() => {
    setUnlocked(true);
    setWrong(false);
  }, []);

  const tryUnlock = useCallback(() => {
    if (input.trim() === PASSWORD) {
      try {
        sessionStorage.setItem(STORE_KEY, "1");
      } catch {
        // 忽略
      }
      unlock();
    } else {
      setWrong(true);
    }
  }, [input, unlock]);

  useEffect(() => {
    if (!unlocked) return;
    const ac = new AbortController();
    fetchDailyWork(ac.signal)
      .then((d) => {
        if (!ac.signal.aborted) setData(d);
      })
      .catch((e) => {
        if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "加载失败");
      });
    return () => ac.abort();
  }, [unlocked]);

  return (
    <div className="card-quiet card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          每日重点工作安排
        </h2>
        {data ? (
          <span style={{ fontSize: "0.75rem", opacity: 0.55 }}>
            更新于{" "}
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
        <div style={{ maxWidth: 380, margin: "16px auto 0", textAlign: "center" }}>
          <p className="item-body" style={{ marginTop: 0 }}>
            工作安排需密码查看
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
              aria-label="工作安排密码"
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
      ) : error ? (
        <div className="note">加载失败（{error}）。</div>
      ) : !data ? (
        <p className="item-body">加载中…</p>
      ) : (
        <>
          <div style={{ display: "grid", gap: 18, marginTop: 4 }}>
            {data.departments.map((d) => (
              <DeptBlock key={d.dept + d.person} d={d} />
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(96,165,250,0.35)",
              background: "rgba(96,165,250,0.06)",
              display: "grid",
              gap: 4,
            }}
          >
            {data.rules.map((r, i) => (
              <p key={i} style={{ margin: 0, fontSize: "0.8125rem", color: "#93c5fd", lineHeight: 1.55 }}>
                📌 {r}
              </p>
            ))}
          </div>

          <p className="item-body" style={{ fontSize: "0.6875rem", opacity: 0.4, margin: "14px 0 0" }}>
            {data.note}
          </p>
        </>
      )}
    </div>
  );
}
