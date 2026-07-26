"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type AihotItem,
  categoryLabel,
  fetchAihotSelected,
  formatAihotTime,
  AIHOT_ORIGIN,
} from "@/lib/aihot";

type Status = "loading" | "ok" | "error" | "refreshing";

type Props = {
  limit?: number;
  /** 服务端/构建期预取的数据，避免首屏永远转圈 */
  initialItems?: AihotItem[];
};

export function AihotSelected({ limit = 8, initialItems = [] }: Props) {
  const hasInitial = initialItems.length > 0;
  const [status, setStatus] = useState<Status>(hasInitial ? "ok" : "loading");
  const [items, setItems] = useState<AihotItem[]>(initialItems);
  const [error, setError] = useState("");
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal, isRefresh = false) => {
      if (isRefresh) setStatus("refreshing");
      else if (!hasInitial) setStatus("loading");
      setError("");
      try {
        const list = await fetchAihotSelected({
          mode: "selected",
          window: "7d",
          limit,
          signal,
          timeoutMs: 10000,
        });
        if (signal?.aborted) return;
        setItems(list);
        setStatus("ok");
        setRefreshedAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
      } catch (e) {
        if (signal?.aborted) return;
        const msg =
          e instanceof Error
            ? e.name === "AbortError" || /timeout|aborted/i.test(e.message)
              ? "请求超时"
              : e.message
            : "加载失败";
        // 有预取数据时失败不盖掉列表
        if (hasInitial || items.length > 0) {
          setStatus("ok");
          setError(`刷新失败：${msg}（仍显示已有数据）`);
        } else {
          setStatus("error");
          setError(msg);
        }
      }
    },
    [hasInitial, items.length, limit],
  );

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal, hasInitial);
    return () => ac.abort();
    // 仅挂载时拉一次；limit 变才重拉
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return (
    <section className="section" aria-labelledby="aihot-selected-title">
      <div className="section-head">
        <h2 id="aihot-selected-title" className="section-title">
          AI 精选
        </h2>
        <a
          href={AIHOT_ORIGIN}
          className="link-accent"
          target="_blank"
          rel="noreferrer"
        >
          AI HOT →
        </a>
      </div>
      <p className="item-body" style={{ marginTop: 0, marginBottom: 12 }}>
        数据来自{" "}
        <a
          href={AIHOT_ORIGIN}
          target="_blank"
          rel="noreferrer"
          className="link-accent"
        >
          aihot.virxact.com
        </a>{" "}
        精选接口（mode=selected）
        {hasInitial ? " · 构建时已预取" : ""}
        {refreshedAt ? ` · 浏览器刷新于 ${refreshedAt}` : ""}
        {status === "refreshing" ? " · 刷新中…" : ""}
      </p>

      {status === "loading" && items.length === 0 && (
        <div className="card card-pad">
          <div className="item-body">正在拉取 AI HOT 精选…</div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void load(undefined, false)}
            >
              重试
            </button>
            <a
              className="btn btn-ghost"
              href={AIHOT_ORIGIN}
              target="_blank"
              rel="noreferrer"
            >
              打开 AI HOT
            </a>
          </div>
        </div>
      )}

      {status === "error" && items.length === 0 && (
        <div className="card card-pad">
          <div className="item-body" style={{ color: "var(--amber)" }}>
            精选加载失败：{error}。可点重试，或打开 AI HOT。
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void load(undefined, false)}
            >
              重试
            </button>
            <a
              className="btn btn-ghost"
              href={AIHOT_ORIGIN}
              target="_blank"
              rel="noreferrer"
            >
              打开 AI HOT
            </a>
          </div>
        </div>
      )}

      {status === "ok" && items.length === 0 && (
        <div className="card card-pad">
          <div className="item-body">近 7 日暂无精选条目。</div>
        </div>
      )}

      {error && items.length > 0 ? (
        <p className="item-body" style={{ color: "var(--amber)", marginBottom: 10 }}>
          {error}
        </p>
      ) : null}

      {items.length > 0 && (
        <div className="list-stack">
          {items.map((item) => (
            <article key={item.id} className="card card-pad aihot-card">
              <div className="meta-row">
                {typeof item.score === "number" ? (
                  <span
                    className={`score-pill ${item.score >= 80 ? "score-high" : "score-mid"}`}
                  >
                    {item.score}
                  </span>
                ) : null}
                <span className="chip chip-amber">
                  {categoryLabel(item.category)}
                </span>
                <span>{formatAihotTime(item.publishedAt)}</span>
                {item.source?.name ? <span>{item.source.name}</span> : null}
              </div>
              <h3 className="item-title">
                <a
                  href={item.links?.aihot || item.links?.original || AIHOT_ORIGIN}
                  target="_blank"
                  rel="noreferrer"
                  className="aihot-title-link"
                >
                  {item.title}
                </a>
              </h3>
              {item.summary ? (
                <p className="item-body">{item.summary}</p>
              ) : null}
              <div className="aihot-actions">
                {item.links?.aihot ? (
                  <a
                    className="link-accent"
                    href={item.links.aihot}
                    target="_blank"
                    rel="noreferrer"
                  >
                    AI HOT 阅读
                  </a>
                ) : null}
                {item.links?.original ? (
                  <a
                    className="link-accent"
                    href={item.links.original}
                    target="_blank"
                    rel="noreferrer"
                  >
                    原文
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
