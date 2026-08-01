"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type AgentActivityEntry,
  fetchAgentActivity,
} from "@/lib/tender-trends";

type Props = {
  /** 构建期从 data/agent-activity.jsonl 末尾取的最新一条（首屏） */
  initial: AgentActivityEntry | null;
};

/**
 * 「工坊 AI 最近干了啥」日报卡片（M2 最小版）。
 * 构建期 inline 最近一条；挂载后拉 /data/agent-activity.json 热刷。
 */
export function AgentPulse({ initial }: Props) {
  const [entry, setEntry] = useState<AgentActivityEntry | null>(initial);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const next = await fetchAgentActivity(signal);
      if (signal?.aborted) return;
      const latest = next?.entries?.[0];
      if (latest && latest.ts) {
        setEntry((cur) =>
          !cur || new Date(latest.ts) > new Date(cur.ts) ? latest : cur,
        );
      }
    } catch {
      if (signal?.aborted) return;
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void refresh(ac.signal);
    return () => ac.abort();
  }, [refresh]);

  if (!entry) {
    return (
      <div className="note" style={{ marginBottom: 16 }}>
        <strong style={{ fontWeight: 650 }}>工坊 AI 日报：</strong>
        暂无运行记录{failed ? "（热更新失败）" : ""}。
      </div>
    );
  }

  const when = new Date(entry.ts).toLocaleString("zh-CN", { hour12: false });

  return (
    <div className="note" style={{ marginBottom: 16 }}>
      <strong style={{ fontWeight: 650 }}>工坊 AI 日报：</strong>
      {entry.ok ? (
        <>
          标讯同步于 {when}，新增 {entry.newCount} 条、在窗 {entry.activeCount}{" "}
          条，已留痕入库。
        </>
      ) : (
        <>
          标讯同步于 {when} <strong style={{ color: "#f87171" }}>失败</strong>
          {entry.note ? `（${entry.note}）` : ""}，展示历史数据。
        </>
      )}
      {failed ? "（日报热更新失败，显示构建期记录）" : ""}
    </div>
  );
}
