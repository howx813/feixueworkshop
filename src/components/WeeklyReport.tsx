"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type WeeklyItem,
  type WeeklyReportFile,
  fetchWeeklyReport,
} from "@/lib/weekly-report";

const PASSWORD = "9822";
const STORE_KEY = "feixue-weekly-unlocked";

function ItemList({ items, showMoney }: { items: WeeklyItem[]; showMoney?: boolean }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 10 }}>
      {items.map((it, i) => (
        <li key={`${it.title}-${i}`} style={{ fontSize: "0.9375rem", lineHeight: 1.55 }}>
          <a href={it.sourceUrl || undefined} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
            {it.title}
          </a>
          <span style={{ display: "block", fontSize: "0.8125rem", opacity: 0.65, marginTop: 2 }}>
            {it.city}
            {showMoney ? ` · ${it.moneyText}` : ""} · 截止 {it.bidDeadline} · 首见 {it.firstSeenAt}
          </span>
        </li>
      ))}
    </ul>
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
      // 兜底：老浏览器/权限受限
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

  const o = data.overview;

  return (
    <>
      <div className="day-bar" style={{ marginTop: 0 }}>
        <strong>
          {data.week} · {data.range.from} ~ {data.range.to}
        </strong>
        <span>数据截至 {data.dataAsOf || "—"}</span>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: "6px 14px", fontSize: "0.875rem" }}
          onClick={() => void copyAll()}
        >
          {copied ? "✓ 已复制" : "一键复制周报"}
        </button>
      </div>

      {data.insight ? (
        <div className="card-quiet card-pad" style={{ marginBottom: 20 }}>
          <p className="item-body" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {data.insight}
          </p>
        </div>
      ) : null}

      <div className="card-quiet card-pad" style={{ marginBottom: 20 }}>
        <div className="meta-row" style={{ gap: 18, flexWrap: "wrap", fontSize: "1rem" }}>
          <span>
            新增 <strong style={{ fontSize: "1.35rem" }}>{o.newCount}</strong>
          </span>
          <span>
            在途 <strong style={{ fontSize: "1.35rem" }}>{o.activeCount}</strong>
          </span>
          <span>
            5★ <strong style={{ fontSize: "1.35rem" }}>{o.fiveStarCount}</strong>
          </span>
          <span>
            披露金额 <strong style={{ fontSize: "1.35rem" }}>{o.totalMoneyWan >= 10000 ? `${(o.totalMoneyWan / 10000).toFixed(1)} 亿` : `${o.totalMoneyWan} 万`}</strong>
          </span>
        </div>
        {!o.comparable ? (
          <p className="item-body" style={{ fontSize: "0.8125rem", opacity: 0.65, margin: "10px 0 0" }}>
            数据积累中（已 {o.historyDays} 天），满 5 天后开启环比。
          </p>
        ) : null}
      </div>

      {data.fiveStar.length ? (
        <section style={{ marginBottom: 22 }}>
          <h2 className="section-title">5★ 值得盯</h2>
          <ItemList items={data.fiveStar} showMoney />
        </section>
      ) : null}

      {data.deadlineSoon.length ? (
        <section style={{ marginBottom: 22 }}>
          <h2 className="section-title">临近截止（10 天内）</h2>
          <ItemList items={data.deadlineSoon} />
        </section>
      ) : null}

      {data.moversUp.length ? (
        <section style={{ marginBottom: 22 }}>
          <h2 className="section-title">异动升温（环比上周）</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {data.moversUp.map((m) => (
              <span key={m.name} className="chip">
                {m.name} {m.prev} → {m.curr}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <p className="item-body" style={{ fontSize: "0.8125rem", opacity: 0.6 }}>
        数据健康：本周同步 {data.health.days} 天（成功 {data.health.ok} / 失败 {data.health.fail}）
        · 工坊 AI 运行 {data.health.agentRuns} 次（成功 {data.health.agentOk}）。
        口径：精匹配条目；行业按出现次数计。
      </p>
    </>
  );
}
