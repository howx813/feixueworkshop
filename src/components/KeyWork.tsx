"use client";

import { useCallback, useEffect, useState } from "react";
import { type KeyWorkFile, type KeyWorkSection, fetchKeyWork } from "@/lib/key-work";

const PASSWORD = "9822";
const STORE_KEY = "feixue-keywork-unlocked";

function SectionBlock({ s }: { s: KeyWorkSection }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 6,
          padding: "10px 14px",
          borderRadius: 10,
          background: "var(--surface-1)",
          border: "1px solid var(--border-soft)",
        }}
      >
        <strong style={{ fontSize: "0.9375rem" }}>
          {s.icon} {s.name}
        </strong>
        {(s.anchor || s.weight) ? (
          <span style={{ fontSize: "0.75rem", opacity: 0.55 }}>{s.anchor || s.weight}</span>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: 5 }}>
        {s.items.map((it, i) => (
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
            <span style={{ flex: 1, lineHeight: 1.5, opacity: 0.85 }}>
              {it.task}
              {it.source ? (
                <span style={{ opacity: 0.5, fontSize: "0.75rem" }}>（{it.source}）</span>
              ) : null}
            </span>
            <span
              style={{
                flexShrink: 0,
                fontSize: "0.75rem",
                padding: "2px 10px",
                borderRadius: 99,
                background: "rgba(96,165,250,0.12)",
                color: "#93c5fd",
                border: "1px solid rgba(96,165,250,0.25)",
              }}
            >
              {it.owner}
            </span>
            <span
              style={{
                flexShrink: 0,
                fontSize: "0.75rem",
                padding: "2px 10px",
                borderRadius: 99,
                background: "rgba(234,179,8,0.12)",
                color: "#fbbf24",
                border: "1px solid rgba(234,179,8,0.25)",
              }}
            >
              ⏱ {it.deadline}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KeyWorkCard() {
  const [unlocked, setUnlocked] = useState(true);
  const [data, setData] = useState<KeyWorkFile | null>(null);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORE_KEY) === "1") setUnlocked(true);
    } catch {
      // ignore
    }
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

  useEffect(() => {
    if (!unlocked) return;
    const ac = new AbortController();
    fetchKeyWork(ac.signal)
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
          重点工作安排
        </h2>
        {data ? (
          <span style={{ fontSize: "0.75rem", opacity: 0.55 }}>
            {data.meeting.name} · {data.meeting.time} · 主持：{data.meeting.host}
          </span>
        ) : null}
      </div>

      {!unlocked ? (
        <div style={{ maxWidth: 380, margin: "16px auto 0", textAlign: "center" }}>
          <p className="item-body" style={{ marginTop: 0 }}>重点工作需密码查看</p>
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
              aria-label="重点工作密码"
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
      ) : error ? (
        <div className="note">加载失败（{error}）。</div>
      ) : !data ? (
        <p className="item-body">加载中…</p>
      ) : (
        <>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(96,165,250,0.35)",
              background: "rgba(96,165,250,0.06)",
              marginBottom: 4,
            }}
          >
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "#93c5fd", lineHeight: 1.55 }}>
              📌 {data.meeting.rule}
            </p>
          </div>
          {data.kpiAnchors && data.kpiAnchors.length > 0 ? (
            <div style={{ display: "grid", gap: 6, margin: "8px 0 4px" }}>
              {data.kpiAnchors.map((k) => (
                <div
                  key={k.name}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border-soft)",
                    background: "var(--surface-1)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4, alignItems: "baseline" }}>
                    <strong style={{ fontSize: "0.8125rem" }}>🎯 {k.name}</strong>
                    <span style={{ fontSize: "0.6875rem", opacity: 0.5 }}>{k.weight}</span>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: "0.75rem", opacity: 0.65, lineHeight: 1.5 }}>
                    目标：{k.target}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#fbbf24", lineHeight: 1.5 }}>
                    现状：{k.current}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
            {data.sections.map((s) => (
              <SectionBlock key={s.name} s={s} />
            ))}
          </div>
          <p className="item-body" style={{ fontSize: "0.6875rem", opacity: 0.4, margin: "14px 0 0" }}>
            {data.note} · 更新于{" "}
            {new Date(data.generatedAt).toLocaleString("zh-CN", {
              hour12: false,
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </>
      )}
    </div>
  );
}
