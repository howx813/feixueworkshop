"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type WechatMpFile,
  fetchWechatMpPublic,
  formatWechatDate,
} from "@/lib/wechat-mp";

type Props = {
  initial: WechatMpFile;
};

export function WechatMpBoard({ initial }: Props) {
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState<"idle" | "refreshing" | "error">("idle");
  const [error, setError] = useState("");

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setStatus("refreshing");
    setError("");
    try {
      const next = await fetchWechatMpPublic(signal);
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
    void refresh(ac.signal);
    return () => ac.abort();
  }, [refresh]);

  const syncedLabel = data.syncedAt
    ? new Date(data.syncedAt).toLocaleString("zh-CN", { hour12: false })
    : "尚未同步";

  return (
    <section className="section" aria-label="公众号文章">
      <div className="day-bar">
        <strong>
          {data.accountName || "公众号"} · {data.itemCount} 篇
        </strong>
        <span>
          {data.mode === "draft-fallback" ? "草稿箱回退 · " : ""}
          同步于 {syncedLabel}
        </span>
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
        <div className="note" style={{ marginBottom: 12 }}>
          热更新失败（{error}），仍展示构建期快照。
        </div>
      ) : null}

      {data.note ? (
        <p
          className="item-body"
          style={{ fontSize: "0.8125rem", opacity: 0.8, marginBottom: 12 }}
        >
          {data.note}
        </p>
      ) : null}

      {data.items.length === 0 ? (
        <article className="card card-pad">
          <h2 className="item-title" style={{ marginTop: 0, fontSize: "1rem" }}>
            还没有同步到文章
          </h2>
          <p className="item-body" style={{ marginBottom: 0 }}>
            在 <code className="inline-code">.env.local</code> 配置 AppID/AppSecret，
            并把运行机器公网 IP 加入公众平台白名单后执行{" "}
            <code className="inline-code">npm run wechat:sync</code>。
            {data.note ? ` ${data.note}` : ""}
          </p>
        </article>
      ) : (
        <div className="list-stack">
          {data.items.map((item, index) => (
            <article key={item.id} className="card card-pad">
              <div className="meta-row">
                <span className="chip chip-accent">公众号</span>
                <span>{formatWechatDate(item.publishedAt)}</span>
                <span>#{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h2 className="item-title" style={{ fontSize: "1.0625rem" }}>
                {item.url ? (
                  <a
                    href={item.url}
                    className="link-accent"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </h2>
              {item.digest ? (
                <p className="item-body">{item.digest}</p>
              ) : null}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                {item.url ? (
                  <a
                    href={item.url}
                    className="btn btn-primary"
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: "4px 12px", fontSize: "0.8125rem" }}
                  >
                    微信原文
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
