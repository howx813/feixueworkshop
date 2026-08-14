"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type TenderFocusFilter,
  type TenderItem,
  type TendersFile,
  fetchTendersPublic,
  filterTendersByFocus,
  formatDocFee,
  formatStars,
  formatTenderMoney,
  isAwardNotice,
  starClass,
  tenderScoreClass,
} from "@/lib/tenders";
import { CtaAiAwardAnalysisPanel } from "@/components/CtaAiAwardAnalysis";

type Props = {
  initial: TendersFile;
};

const FOCUS_TABS: { id: TenderFocusFilter; label: string; hint: string }[] = [
  { id: "all", label: "全部", hint: "贵州软件/信息化池 + 全国专项" },
  {
    id: "cta-ai",
    label: "中电信人工智能科技",
    hint: "全国检索 · 中电信人工智能科技有限公司（含北京）",
  },
  {
    id: "telecom-gz",
    label: "电信贵州 / 数智",
    hint: "中国电信贵州 · 中电信数智贵州",
  },
];

export function TenderBoard({ initial }: Props) {
  const [data, setData] = useState<TendersFile>(initial);
  const [status, setStatus] = useState<"idle" | "refreshing" | "error">("idle");
  const [error, setError] = useState("");
  const [focus, setFocus] = useState<TenderFocusFilter>("cta-ai");

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

  const allItems: TenderItem[] = useMemo(
    () => data.items || [],
    [data.items],
  );
  const items = useMemo(
    () => filterTendersByFocus(allItems, focus),
    [allItems, focus],
  );
  const fiveStar = items.filter((i) => (i.stars || 0) >= 5);
  const ctaAiN =
    data.ctaAiCount ??
    allItems.filter((i) => (i.focusTags || []).includes("cta-ai")).length;
  const telecomGzN =
    data.telecomGzCount ??
    allItems.filter((i) => (i.focusTags || []).includes("telecom-gz")).length;
  const syncedLabel = data.syncedAt
    ? new Date(data.syncedAt).toLocaleString("zh-CN", { hour12: false })
    : "—";

  return (
    <>
      <div className="day-bar">
        <strong>线索 {items.length} 条</strong>
        <span>
          5★ {fiveStar.length}
          {focus === "all"
            ? ` · 全池 ${allItems.length} · 深挖 ${data.deepAnalyzed ?? 0}`
            : ` · 筛选自全池 ${allItems.length}`}
        </span>
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

      <div
        className="meta-row"
        style={{ marginBottom: 14, flexWrap: "wrap", gap: 8 }}
        role="tablist"
        aria-label="标讯筛选"
      >
        {FOCUS_TABS.map((tab) => {
          const count =
            tab.id === "all"
              ? allItems.length
              : tab.id === "cta-ai"
                ? ctaAiN
                : telecomGzN;
          const active = focus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              title={tab.hint}
              className={`chip ${active ? "chip-accent" : ""}`}
              style={{
                cursor: "pointer",
                border: active ? "1px solid var(--accent, #2563eb)" : undefined,
                fontWeight: active ? 650 : 500,
              }}
              onClick={() => setFocus(tab.id)}
            >
              {tab.label}
              <span style={{ opacity: 0.75, marginLeft: 6 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {status === "error" ? (
        <div className="note" style={{ marginBottom: 16 }}>
          热更新失败（{error}），仍展示构建期快照。可稍后再点「刷新快照」。
        </div>
      ) : null}

      <div className="note" style={{ marginBottom: 20 }}>
        <strong style={{ fontWeight: 650 }}>当前视图：</strong>
        {FOCUS_TABS.find((t) => t.id === focus)?.hint}
        。默认打开「中电信人工智能科技」全国专项（北京主体标讯不限贵州省码）。
        <br />
        <strong style={{ fontWeight: 650 }}>匹配星级：</strong>
        1–5 星综合软件相关度、公开标准关键词重合、是否在投、规模与截止信息。
        <strong> 5 星</strong>
        会尝试下载公开招标附件并做资格摘录（本机目录，不进公开仓库）。
        <br />
        <strong style={{ fontWeight: 650 }}>关注字段：</strong>
        投标截止、文件资格摘录、规模、标书/文件费；中标公示另抽中标人与中标金额。自动抽取可能不全，务必核对原文。
      </div>

      {focus === "cta-ai" ? (
        <CtaAiAwardAnalysisPanel items={allItems} />
      ) : null}

      <div className="list-stack">
        {items.length === 0 ? (
          <article className="card card-pad">
            <h2 className="item-title" style={{ marginTop: 0 }}>
              暂无匹配标讯
            </h2>
            <p className="item-body">
              {focus === "cta-ai" ? (
                <>
                  当前快照里还没有「中电信人工智能科技」专项条目。请确认已跑{" "}
                  <code style={{ fontSize: "0.9em" }}>npm run tenders:sync</code>{" "}
                  （含全国检索），并点「刷新快照」。
                </>
              ) : (
                <>
                  执行{" "}
                  <code style={{ fontSize: "0.9em" }}>npm run tenders:sync</code>{" "}
                  后，快照会写入{" "}
                  <code style={{ fontSize: "0.9em" }}>
                    public/data/tenders.json
                  </code>
                  。
                </>
              )}
            </p>
          </article>
        ) : (
          items.map((item, index) => (
            <article key={item.id} className="card card-pad">
              <div className="meta-row">
                <span
                  className={`star-pill ${starClass(item.stars || 0)}`}
                  title={`综合分 ${item.starScore ?? item.score}`}
                >
                  {formatStars(item.stars || 0)}
                </span>
                <span className={`score-pill ${tenderScoreClass(item.score)}`}>
                  {item.starScore ?? item.score}
                </span>
                <span className="chip chip-amber">
                  {item.tenderType || "标讯"}
                </span>
                {(item.focusTags || []).includes("cta-ai") ? (
                  <span className="chip chip-accent" title="中电信人工智能科技专项">
                    中电信AI
                  </span>
                ) : null}
                {(item.focusTags || []).includes("telecom-gz") ? (
                  <span className="chip" title="电信贵州 / 数智">
                    电信黔
                  </span>
                ) : null}
                <span>{item.date || "日期未知"}</span>
                <span>
                  {[item.province, item.city].filter(Boolean).join(" · ")}
                </span>
                <span>#{String(index + 1).padStart(2, "0")}</span>
              </div>

              <h2 className="item-title" style={{ fontSize: "1.0625rem" }}>
                {item.title}
              </h2>

              {item.starReasons?.length ? (
                <p
                  className="item-body"
                  style={{ fontSize: "0.8125rem", opacity: 0.85, marginTop: 4 }}
                >
                  分级：{item.starReasons.slice(0, 4).join(" · ")}
                </p>
              ) : null}

              <p className="item-body" style={{ marginBottom: 10 }}>
                <strong style={{ fontWeight: 650 }}>招标人：</strong>
                {item.buyer || "未披露"}
                {item.purchaseTypeName ? (
                  <>
                    <span style={{ margin: "0 0.5rem", opacity: 0.4 }}>·</span>
                    {item.purchaseTypeName}
                  </>
                ) : null}
              </p>

              {isAwardNotice(item) && (item.winner || item.awardMoneyWan) ? (
                <div className="tender-keygrid" aria-label="中标信息">
                  <div className="tender-keycell">
                    <span className="tender-keylabel">中标/成交人</span>
                    <span className="tender-keyvalue">
                      {item.winner || "未解析"}
                    </span>
                  </div>
                  <div className="tender-keycell">
                    <span className="tender-keylabel">中标金额</span>
                    <span className="tender-keyvalue">
                      {(item.awardMoneyWan || 0) > 0
                        ? formatTenderMoney(item.awardMoneyWan || 0)
                        : item.scaleText || formatTenderMoney(item.moneyWan)}
                    </span>
                  </div>
                  {item.candidates && item.candidates.length > 1 ? (
                    <div className="tender-keycell" style={{ gridColumn: "1 / -1" }}>
                      <span className="tender-keylabel">候选人</span>
                      <span className="tender-keyvalue" style={{ fontSize: "0.8125rem" }}>
                        {item.candidates
                          .map(
                            (c) =>
                              `${c.rank}.${c.name}${
                                c.moneyWan > 0
                                  ? `（${formatTenderMoney(c.moneyWan)}）`
                                  : ""
                              }`,
                          )
                          .join(" · ")}
                      </span>
                    </div>
                  ) : null}
                  {item.awardNoticeKind ? (
                    <div className="tender-keycell">
                      <span className="tender-keylabel">公示类型</span>
                      <span className="tender-keyvalue">{item.awardNoticeKind}</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="tender-keygrid" aria-label="关键信息">
                  <div className="tender-keycell">
                    <span className="tender-keylabel">投标截止</span>
                    <span className="tender-keyvalue">
                      {item.bidDeadline || "未写明"}
                    </span>
                  </div>
                  <div className="tender-keycell">
                    <span className="tender-keylabel">项目规模</span>
                    <span className="tender-keyvalue">
                      {item.scaleText || formatTenderMoney(item.moneyWan)}
                      {item.bondText ? ` · ${item.bondText}` : ""}
                    </span>
                  </div>
                  <div className="tender-keycell">
                    <span className="tender-keylabel">标书/文件费</span>
                    <span
                      className={`tender-keyvalue${
                        item.docFeeRequired === true
                          ? " tender-fee-yes"
                          : item.docFeeRequired === false
                            ? " tender-fee-no"
                            : ""
                      }`}
                    >
                      {formatDocFee(item)}
                    </span>
                  </div>
                  <div className="tender-keycell">
                    <span className="tender-keylabel">获取文件截止</span>
                    <span className="tender-keyvalue">
                      {item.fileGetDeadline || "未写明"}
                    </span>
                  </div>
                </div>
              )}

              {item.stars === 5 && item.deepAnalysis ? (
                <div className="tender-deepbox">
                  <div className="tender-keylabel" style={{ marginBottom: 6 }}>
                    5★ 深度分析
                  </div>
                  <p className="item-body" style={{ margin: "0 0 8px" }}>
                    {item.deepAnalysis.summary}
                  </p>
                  {item.deepAnalysis.matchedStandards?.length ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {item.deepAnalysis.matchedStandards.map((s) => (
                        <span key={`${item.id}-std-${s}`} className="chip">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {item.deepAnalysis.mustRequirements?.length ? (
                    <ul className="tender-reqlist">
                      {item.deepAnalysis.mustRequirements.slice(0, 6).map((r) => (
                        <li key={`${item.id}-req-${r.slice(0, 24)}`}>{r}</li>
                      ))}
                    </ul>
                  ) : null}
                  {item.deepAnalysis.files?.length ? (
                    <p
                      className="item-body"
                      style={{ fontSize: "0.8125rem", margin: "8px 0 0" }}
                    >
                      附件：
                      {item.deepAnalysis.files
                        .map((f) =>
                          f.error ? `${f.fileName}(失败)` : f.fileName,
                        )
                        .join("、")}
                      {item.deepAnalysis.hasLocalDocs
                        ? " · 已落盘本机 data/tender-docs/"
                        : ""}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {(item.qualHits?.length || item.qualSection) && (
                <div className="tender-qualbox">
                  <div className="tender-keylabel" style={{ marginBottom: 6 }}>
                    文件资格要求（摘录）
                  </div>
                  {item.qualHits?.length ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginBottom: item.qualSection ? 8 : 0,
                      }}
                    >
                      {item.qualHits.map((h) => (
                        <span key={`${item.id}-qh-${h}`} className="chip chip-amber">
                          {h}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {item.qualSection ? (
                    <p className="item-body" style={{ margin: 0, fontSize: "0.875rem" }}>
                      {item.qualSection}
                      {item.qualSection.length >= 500 ? "…" : ""}
                    </p>
                  ) : null}
                </div>
              )}

              {item.matchedQuals?.length ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 10,
                    marginTop: 10,
                  }}
                >
                  <span className="tender-keylabel" style={{ width: "100%" }}>
                    标准关键词提示
                  </span>
                  {item.matchedQuals.map((q) => (
                    <span key={`${item.id}-${q.id}`} className="chip">
                      {q.name}
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
