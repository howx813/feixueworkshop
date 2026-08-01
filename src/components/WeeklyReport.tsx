"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type WeeklyReportFile,
  fetchWeeklyReport,
} from "@/lib/weekly-report";

const PASSWORD = "9822";
const STORE_KEY = "feixue-weekly-unlocked";

/** markdown-lite 渲染：##/### 标题、- 列表、> 引用、其余为段落（周报正文够用即可） */
function WorkBody({ text }: { text: string }) {
  const blocks: { kind: string; text: string }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith("### ")) blocks.push({ kind: "h3", text: t.slice(4) });
    else if (t.startsWith("## ")) blocks.push({ kind: "h2", text: t.slice(3) });
    else if (t.startsWith("# ")) blocks.push({ kind: "h2", text: t.slice(2) });
    else if (t.startsWith("- ") || t.startsWith("· ") || t.startsWith("* "))
      blocks.push({ kind: "li", text: t.slice(2) });
    else if (t.startsWith("> ")) blocks.push({ kind: "quote", text: t.slice(2) });
    else blocks.push({ kind: "p", text: t });
  }
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {blocks.map((b, i) => {
        if (b.kind === "h2")
          return (
            <h2 key={i} className="section-title" style={{ margin: "14px 0 0" }}>
              {b.text}
            </h2>
          );
        if (b.kind === "h3")
          return (
            <h3 key={i} className="section-title" style={{ fontSize: "1rem", margin: "10px 0 0" }}>
              {b.text}
            </h3>
          );
        if (b.kind === "li")
          return (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: "0.9375rem", lineHeight: 1.6 }}>
              <span style={{ opacity: 0.5 }}>·</span>
              <span style={{ flex: 1 }}>{b.text}</span>
            </div>
          );
        if (b.kind === "quote")
          return (
            <p
              key={i}
              className="item-body"
              style={{ margin: 0, paddingLeft: 12, borderLeft: "2px solid rgba(128,128,128,0.4)", opacity: 0.8 }}
            >
              {b.text}
            </p>
          );
        return (
          <p key={i} className="item-body" style={{ margin: 0, lineHeight: 1.7 }}>
            {b.text}
          </p>
        );
      })}
    </div>
  );
}

export function WeeklyReport() {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);
  const [data, setData] = useState<WeeklyReportFile | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

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
    fetchWeeklyReport(ac.signal)
      .then((d) => {
        if (!ac.signal.aborted) setData(d);
      })
      .catch((e) => {
        if (!ac.signal.aborted) setError(e instanceof Error ? e.message : "加载失败");
      });
    return () => ac.abort();
  }, [unlocked]);

  const tryUnlock = useCallback(() => {
    if (input.trim() === PASSWORD) {
      setUnlocked(true);
      setWrong(false);
      try {
        sessionStorage.setItem(STORE_KEY, "1");
      } catch {
        // 忽略
      }
    } else {
      setWrong(true);
    }
  }, [input]);

  const copyAll = useCallback(async () => {
    if (!data?.copyText) return;
    try {
      await navigator.clipboard.writeText(data.copyText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = data.copyText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [data]);

  if (!unlocked) {
    return (
      <div className="card-quiet card-pad" style={{ maxWidth: 380, margin: "48px auto 0", textAlign: "center" }}>
        <p className="item-body" style={{ marginTop: 0 }}>
          本页内容需密码查看
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
            aria-label="查看密码"
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

  if (error) {
    return <div className="note">周报加载失败（{error}）。</div>;
  }
  if (!data) {
    return <p className="item-body">加载中…</p>;
  }

  return (
    <>
      <div className="day-bar" style={{ marginTop: 0 }}>
        <strong>
          {data.week} · {data.range.from} ~ {data.range.to}
        </strong>
        <span>
          更新于{" "}
          {new Date(data.generatedAt).toLocaleString("zh-CN", { hour12: false })}
        </span>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: "6px 14px", fontSize: "0.875rem" }}
          onClick={() => void copyAll()}
        >
          {copied ? "✓ 已复制" : "一键复制周报"}
        </button>
      </div>

      {data.hasWork ? (
        <div className="card-quiet card-pad">
          <WorkBody text={data.workText} />
        </div>
      ) : (
        <div className="note">
          本周正文待 Hermes 侧投放（写入{" "}
          <code style={{ fontSize: "0.9em" }}>
            docs/weekly-hub/{data.week}.work.md
          </code>{" "}
          后重新生成即合并）。
        </div>
      )}

      {data.health.line ? (
        <p className="item-body" style={{ fontSize: "0.8125rem", opacity: 0.6, marginTop: 18 }}>
          {data.health.line}
        </p>
      ) : null}
    </>
  );
}
