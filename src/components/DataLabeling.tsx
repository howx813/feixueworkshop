"use client";

import { useEffect, useState } from "react";

type LabelingFile = {
  schemaVersion: number;
  generatedAt: string;
  owner: string;
  note: string;
  overview: { positioning: string; teamLead: string };
  metrics: {
    annualContractTarget: string;
    ytdSigned: { name: string; amount: number }[];
    fundRisk: string;
  };
  projects: { name: string; client: string; amount: string; status: string; next: string; owner: string }[];
  pipeline: { name: string; note: string }[];
};

const PASSWORD = "9822";
const STORE_KEY = "feixue-labeling-unlocked";

export function DataLabelingCard() {
  const [unlocked, setUnlocked] = useState(true);
  const [data, setData] = useState<LabelingFile | null>(null);
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

  useEffect(() => {
    if (!unlocked) return;
    fetch("/data/data-labeling.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`(${r.status})`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"));
  }, [unlocked]);

  if (!unlocked) {
    return (
      <div className="card-quiet card-pad">
        <h2 className="section-title" style={{ margin: 0 }}>数据标注</h2>
        <div style={{ maxWidth: 380, margin: "16px auto 0", textAlign: "center" }}>
          <p className="item-body" style={{ marginTop: 0 }}>数据标注看板需密码查看</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="password"
              inputMode="numeric"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim() === PASSWORD) {
                  try { sessionStorage.setItem(STORE_KEY, "1"); } catch {}
                  setUnlocked(true);
                } else if (e.key === "Enter") setWrong(true);
              }}
              placeholder="输入密码"
              aria-label="数据标注密码"
              style={{
                flex: 1, padding: "10px 12px", borderRadius: 10,
                border: "1px solid rgba(128,128,128,0.35)",
                background: "transparent", color: "inherit", fontSize: "0.9375rem",
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (input.trim() === PASSWORD) {
                  try { sessionStorage.setItem(STORE_KEY, "1"); } catch {}
                  setUnlocked(true);
                } else setWrong(true);
              }}
            >
              查看
            </button>
          </div>
          {wrong ? (
            <p style={{ color: "#f87171", fontSize: "0.8125rem", margin: "10px 0 0" }}>密码不对，再试一次</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="card-quiet card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
        <h2 className="section-title" style={{ margin: 0 }}>数据标注</h2>
        {data ? <span style={{ fontSize: "0.75rem", opacity: 0.55 }}>牵头：{data.overview.teamLead}</span> : null}
      </div>

      {error ? (
        <div className="note">加载失败（{error}）。</div>
      ) : !data ? (
        <p className="item-body">加载中…</p>
      ) : (
        <>
          <p className="item-body" style={{ fontSize: "0.8125rem", opacity: 0.7 }}>{data.overview.positioning}</p>

          {/* 指标与收入 */}
          <div style={{ display: "grid", gap: 6, margin: "10px 0" }}>
            <div style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border-soft)", background: "var(--surface-1)" }}>
              <strong style={{ fontSize: "0.8125rem" }}>💰 合同模式</strong>
              <p style={{ margin: "3px 0 0", fontSize: "0.75rem", opacity: 0.65, lineHeight: 1.5 }}>{data.metrics.annualContractTarget}</p>
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(234,179,8,0.35)", background: "rgba(234,179,8,0.06)" }}>
              <strong style={{ fontSize: "0.8125rem", color: "#fbbf24" }}>⚠️ 资金风险</strong>
              <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: "#fbbf24", lineHeight: 1.5 }}>{data.metrics.fundRisk}</p>
            </div>
          </div>

          {/* 年内已签 */}
          <p style={{ fontSize: "0.75rem", opacity: 0.5, margin: "12px 0 4px" }}>2026 年已签（万元）</p>
          <div style={{ display: "grid", gap: 4, marginBottom: 14 }}>
            {data.metrics.ytdSigned.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", padding: "5px 10px", borderRadius: 8, background: "var(--surface-1)", border: "1px solid var(--border-soft)" }}>
                <span style={{ opacity: 0.85 }}>{s.name}</span>
                <strong>{s.amount}</strong>
              </div>
            ))}
          </div>

          {/* 重点项目 */}
          <p style={{ fontSize: "0.75rem", opacity: 0.5, margin: "0 0 4px" }}>重点项目（含 AI 公司相关）</p>
          <div style={{ display: "grid", gap: 5 }}>
            {data.projects.map((p, i) => (
              <div key={i} style={{ padding: "7px 10px", borderRadius: 8, background: "var(--surface-1)", border: "1px solid var(--border-soft)", fontSize: "0.8125rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                  <strong>{p.name}</strong>
                  <span style={{ fontSize: "0.75rem", color: "#93c5fd" }}>{p.amount}</span>
                </div>
                <p style={{ margin: "3px 0 0", fontSize: "0.75rem", opacity: 0.65 }}>{p.client} · {p.status}</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#fbbf24" }}>→ {p.next}</p>
              </div>
            ))}
          </div>

          {/* 商机储备 */}
          {data.pipeline.length > 0 ? (
            <>
              <p style={{ fontSize: "0.75rem", opacity: 0.5, margin: "14px 0 4px" }}>商机储备</p>
              <div style={{ display: "grid", gap: 4 }}>
                {data.pipeline.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: "0.8125rem", padding: "5px 10px", borderRadius: 8, background: "var(--surface-1)", border: "1px solid var(--border-soft)" }}>
                    <span style={{ opacity: 0.85 }}>{p.name}</span>
                    <span style={{ fontSize: "0.75rem", opacity: 0.55, textAlign: "right" }}>{p.note}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
