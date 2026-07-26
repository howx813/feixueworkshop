"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type TenderItem,
  type TendersFile,
  fetchTendersPublic,
  formatTenderMoney,
  tenderScoreClass,
} from "@/lib/tenders";

type Props = {
  initial: TendersFile;
};

export function TenderBoard({ initial }: Props) {
  const [data, setData] = useState<TendersFile>(initial);
  const [status, setStatus] = useState<"idle" | "refreshing" | "error">("idle");
  const [error, setError] = useState("");

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setStatus("refreshing");
    setError("");
    try {
      const next = await fetchTendersPublic(signal);
      if (signal?.aborted) return;
      if (next?.items) {
        setData(next);
        setStatus("idle");
      } else {
        throw new Error("快照格式异常");
      }
    } catch (e) {
      if (signal?.aborted) return;
      setStatus("error");
      setError(e instanceof Error ? e.message : "刷新失败");
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    // 构建期 JSON 作首屏；挂载后再拉 /data/tenders.json（方案 C 热更新）
    void refresh(ac.signal);
    return () => ac.abort();
  }, [refresh]);

  const items: TenderItem[] = data.items || [];
  const syncedLabel = data.syncedAt
    ? new Date(data.syncedAt).toLocaleString("zh-CN", { hour12: false })
    : "—";

  return (
    <>
      <div className="day-bar">
        <strong>线索 {items.length} 条</strong>
        <span>
          回溯自 {data.since || "—"} · 软件池 {data.softwareCount ?? "—"}
        </span>
        <span>同步于 {syncedLabel}</span>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: "4px 10px", fontSize: "0.8125rem" }}
          onClick={() => void refresh()}
          disabled={status === "refreshing"}
        >
          {status === "refreshing" ? "刷新中…" : "刷新快照"}
        </button>
      </div>

      {status === "error" ? (
        <div className="note" style={{ marginBottom: 16 }}>
          热更新失败（{error}），仍展示构建期快照。可稍后再点「刷新快照」。
        </div>
      ) : null}

      <div className="note" style={{ marginBottom: 20 }}>
        <strong style={{ fontWeight: 650 }}>筛选口径：</strong>
        先筛软件类项目，再标注通服侧可能相关的资质（CMMI、CS、ITSS、ISO27001/20000、系统集成等）。
        标签表示「通服有对应能力」，不等于招标文件已写明该门槛。投标前须人工核验资格条件与证书有效期。
        <br />
        <strong style={{ fontWeight: 650 }}>更新方式（方案 C）：</strong>
        定时跑 <code style={{ fontSize: "0.9em" }}>npm run tenders:sync</code>{" "}
        写快照；站点保持静态，不跑后端。
      </div>

      <div className="list-stack">
        {items.length === 0 ? (
          <article className="card card-pad">
            <h2 className="item-title" style={{ marginTop: 0 }}>
              暂无匹配标讯
            </h2>
            <p className="item-body">
              执行{" "}
              <code style={{ fontSize: "0.9em" }}>npm run tenders:sync</code>{" "}
              后，快照会写入{" "}
              <code style={{ fontSize: "0.9em" }}>public/data/tenders.json</code>
              。
            </p>
          </article>
        ) : (
          items.map((item, index) => (
            <article key={item.id} className="card card-pad">
              <div className="meta-row">
                <span className={`score-pill ${tenderScoreClass(item.score)}`}>
                  {item.score}
                </span>
                <span className="chip chip-amber">
                  {item.tenderType || "标讯"}
                </span>
                <span>{item.date || "日期未知"}</span>
                <span>
                  {[item.province, item.city].filter(Boolean).join(" · ")}
                </span>
                <span>#{String(index + 1).padStart(2, "0")}</span>
              </div>

              <h2 className="item-title" style={{ fontSize: "1.0625rem" }}>
                {item.title}
              </h2>

              <p className="item-body" style={{ marginBottom: 10 }}>
                <strong style={{ fontWeight: 650 }}>招标人：</strong>
                {item.buyer || "未披露"}
                <span style={{ margin: "0 0.5rem", opacity: 0.4 }}>·</span>
                <strong style={{ fontWeight: 650 }}>预算：</strong>
                {formatTenderMoney(item.moneyWan)}
                {item.purchaseTypeName ? (
                  <>
                    <span style={{ margin: "0 0.5rem", opacity: 0.4 }}>·</span>
                    {item.purchaseTypeName}
                  </>
                ) : null}
              </p>

              {item.matchedQuals?.length ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  {item.matchedQuals.map((q) => (
                    <span key={`${item.id}-${q.id}`} className="chip">
                      {q.name}
                      {q.entity ? ` · ${q.entity}` : ""}
                    </span>
                  ))}
                </div>
              ) : null}

              {item.professions?.length ? (
                <p
                  className="item-body"
                  style={{ fontSize: "0.875rem", opacity: 0.85 }}
                >
                  专业标签：{item.professions.slice(0, 6).join(" / ")}
                </p>
              ) : null}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <a
                  href={item.sourceUrl || item.platformUrl}
                  className="btn btn-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  查看来源
                </a>
                <a
                  href={item.platformUrl}
                  className="btn btn-ghost"
                  target="_blank"
                  rel="noreferrer"
                >
                  平台详情
                </a>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}
