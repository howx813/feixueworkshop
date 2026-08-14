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

/** 生命周期分类：在投招采 / 中标结果 / 全部 */
type StageFilter = "open" | "award" | "all";

const FOCUS_TABS: { id: TenderFocusFilter; label: string; short: string; hint: string }[] = [
  { id: "cta-ai", label: "中电信人工智能", short: "中电信AI", hint: "全国 · 中电信人工智能科技（含北京）" },
  { id: "telecom-gz", label: "电信贵州 / 数智", short: "电信黔", hint: "中国电信贵州 · 中电信数智" },
  { id: "all", label: "全部线索", short: "全部", hint: "贵州软件池 + 全国专项" },
];

const STAGE_TABS: { id: StageFilter; label: string }[] = [
  { id: "open", label: "在投招采" },
  { id: "award", label: "中标结果" },
  { id: "all", label: "全部" },
];

function shortTitle(title: string, focus: TenderFocusFilter) {
  let t = title.replace(/\s+/g, " ").trim();
  if (focus === "cta-ai" || /中电信人工智能/.test(t)) {
    t = t
      .replace(/中电信人工智能科技\s*（?\s*北京\s*）?\s*有限公司\s*/g, "")
      .replace(/中电信人工智能科技有限公司\s*/g, "");
  }
  return t.trim() || title;
}

function cardHighlight(item: TenderItem): { label: string; value: string } {
  if (isAwardNotice(item)) {
    const money = item.awardMoneyWan || item.moneyWan || 0;
    return {
      label: item.winner ? "中标人" : "中标金额",
      value: item.winner
        ? `${item.winner}${money > 0 ? ` · ${formatTenderMoney(money)}` : ""}`
        : money > 0
          ? formatTenderMoney(money)
          : item.scaleText || "金额未披露",
    };
  }
  if (item.bidDeadline) {
    return { label: "投标截止", value: item.bidDeadline };
  }
  return {
    label: "规模",
    value: item.scaleText || formatTenderMoney(item.moneyWan),
  };
}

function TenderCard({
  item,
  focus,
  active,
  onSelect,
}: {
  item: TenderItem;
  focus: TenderFocusFilter;
  active: boolean;
  onSelect: () => void;
}) {
  const award = isAwardNotice(item);
  const hi = cardHighlight(item);
  const title = shortTitle(item.title, focus);

  return (
    <button
      type="button"
      className={`tender-card${active ? " tender-card-active" : ""}${award ? " tender-card-award" : ""}`}
      onClick={onSelect}
      aria-pressed={active}
    >
      <div className="tender-card-top">
        <span className={`star-pill ${starClass(item.stars || 0)}`} title={`分 ${item.starScore ?? item.score}`}>
          {formatStars(item.stars || 0)}
        </span>
        <span className={`chip ${award ? "chip-amber" : "chip-accent"}`}>
          {award
            ? (item.awardNoticeKind || item.tenderType || "中标").replace(/公示$/, "")
            : item.tenderType || "招采"}
        </span>
        <span className="tender-card-date">{item.date || "—"}</span>
      </div>
      <h3 className="tender-card-title" title={item.title}>
        {title}
      </h3>
      <p className="tender-card-buyer">{item.buyer || "招标人未披露"}</p>
      <div className="tender-card-fact">
        <span className="tender-keylabel">{hi.label}</span>
        <span className="tender-card-fact-val">{hi.value}</span>
      </div>
      {item.matchedQuals?.length ? (
        <div className="tender-card-tags">
          {item.matchedQuals.slice(0, 3).map((q) => (
            <span key={q.id} className="chip">
              {q.name}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}

function TenderDetail({ item, focus }: { item: TenderItem; focus: TenderFocusFilter }) {
  const award = isAwardNotice(item);
  return (
    <article className="card card-pad tender-detail" id={`tender-detail-${item.id}`}>
      <div className="meta-row" style={{ marginBottom: 8 }}>
        <span className={`star-pill ${starClass(item.stars || 0)}`}>
          {formatStars(item.stars || 0)}
        </span>
        <span className={`score-pill ${tenderScoreClass(item.score)}`}>
          {item.starScore ?? item.score}
        </span>
        <span className="chip chip-amber">{item.tenderType || "标讯"}</span>
        {(item.focusTags || []).includes("cta-ai") ? (
          <span className="chip chip-accent">中电信AI</span>
        ) : null}
        {(item.focusTags || []).includes("telecom-gz") ? (
          <span className="chip">电信黔</span>
        ) : null}
        <span>{item.date || "—"}</span>
        <span>{[item.province, item.city].filter(Boolean).join(" · ") || "地域未标"}</span>
      </div>

      <h2 className="item-title" style={{ marginTop: 0, fontSize: "1.05rem" }}>
        {shortTitle(item.title, focus)}
      </h2>
      {shortTitle(item.title, focus) !== item.title ? (
        <p className="tender-card-buyer" style={{ marginBottom: 8 }}>
          全称：{item.title}
        </p>
      ) : null}

      <p className="item-body" style={{ marginBottom: 12 }}>
        <strong style={{ fontWeight: 650 }}>招标人：</strong>
        {item.buyer || "未披露"}
        {item.purchaseTypeName ? (
          <>
            <span style={{ margin: "0 0.5rem", opacity: 0.4 }}>·</span>
            {item.purchaseTypeName}
          </>
        ) : null}
      </p>

      {award ? (
        <div className="tender-keygrid" aria-label="中标信息">
          <div className="tender-keycell">
            <span className="tender-keylabel">中标/成交人</span>
            <span className="tender-keyvalue">{item.winner || "未解析"}</span>
          </div>
          <div className="tender-keycell">
            <span className="tender-keylabel">中标金额</span>
            <span className="tender-keyvalue">
              {(item.awardMoneyWan || 0) > 0
                ? formatTenderMoney(item.awardMoneyWan || 0)
                : item.scaleText || formatTenderMoney(item.moneyWan)}
            </span>
          </div>
          {item.awardNoticeKind ? (
            <div className="tender-keycell">
              <span className="tender-keylabel">公示类型</span>
              <span className="tender-keyvalue">{item.awardNoticeKind}</span>
            </div>
          ) : null}
          {item.candidates && item.candidates.length > 1 ? (
            <div className="tender-keycell" style={{ gridColumn: "1 / -1" }}>
              <span className="tender-keylabel">候选人</span>
              <span className="tender-keyvalue" style={{ fontSize: "0.8125rem" }}>
                {item.candidates
                  .map(
                    (c) =>
                      `${c.rank}.${c.name}${
                        c.moneyWan > 0 ? `（${formatTenderMoney(c.moneyWan)}）` : ""
                      }`,
                  )
                  .join(" · ")}
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="tender-keygrid" aria-label="关键信息">
          <div className="tender-keycell">
            <span className="tender-keylabel">投标截止</span>
            <span className="tender-keyvalue">{item.bidDeadline || "未写明"}</span>
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
            <span className="tender-keyvalue">{item.fileGetDeadline || "未写明"}</span>
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
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
        </div>
      ) : null}

      {(item.qualHits?.length || item.qualSection) && (
        <div className="tender-qualbox">
          <div className="tender-keylabel" style={{ marginBottom: 6 }}>
            资格摘录
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
              {item.qualSection.length > 280
                ? `${item.qualSection.slice(0, 280)}…`
                : item.qualSection}
            </p>
          ) : null}
        </div>
      )}

      {item.matchedQuals?.length ? (
        <div className="tender-card-tags" style={{ marginBottom: 12 }}>
          {item.matchedQuals.map((q) => (
            <span key={`${item.id}-${q.id}`} className="chip">
              {q.name}
            </span>
          ))}
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
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
  );
}

export function TenderBoard({ initial }: Props) {
  const [data, setData] = useState<TendersFile>(initial);
  const [status, setStatus] = useState<"idle" | "refreshing" | "error">("idle");
  const [error, setError] = useState("");
  const [focus, setFocus] = useState<TenderFocusFilter>("cta-ai");
  const [stage, setStage] = useState<StageFilter>("open");
  const [highOnly, setHighOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    void refresh(ac.signal);
    return () => ac.abort();
  }, [refresh]);

  // 切换主体时：中电信 AI 默认看在投，其余默认全部；清空选中
  useEffect(() => {
    setStage(focus === "cta-ai" ? "open" : "all");
    setSelectedId(null);
  }, [focus]);

  const allItems: TenderItem[] = useMemo(() => data.items || [], [data.items]);
  const focused = useMemo(
    () => filterTendersByFocus(allItems, focus),
    [allItems, focus],
  );

  const openItems = useMemo(
    () => focused.filter((i) => !isAwardNotice(i)),
    [focused],
  );
  const awardItems = useMemo(
    () => focused.filter((i) => isAwardNotice(i)),
    [focused],
  );

  const items = useMemo(() => {
    let list =
      stage === "open" ? openItems : stage === "award" ? awardItems : focused;
    if (highOnly) list = list.filter((i) => (i.stars || 0) >= 4);
    return list;
  }, [stage, openItems, awardItems, focused, highOnly]);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) || null,
    [items, selectedId],
  );

  // 列表变化时若选中项不在当前列表则清空
  useEffect(() => {
    if (selectedId && !items.some((i) => i.id === selectedId)) {
      setSelectedId(null);
    }
  }, [items, selectedId]);

  const fiveStar = focused.filter((i) => (i.stars || 0) >= 5).length;
  const ctaAiN =
    data.ctaAiCount ??
    allItems.filter((i) => (i.focusTags || []).includes("cta-ai")).length;
  const telecomGzN =
    data.telecomGzCount ??
    allItems.filter((i) => (i.focusTags || []).includes("telecom-gz")).length;
  const syncedLabel = data.syncedAt
    ? new Date(data.syncedAt).toLocaleString("zh-CN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";

  const focusCount = (id: TenderFocusFilter) =>
    id === "all" ? allItems.length : id === "cta-ai" ? ctaAiN : telecomGzN;

  const stageCount = (id: StageFilter) =>
    id === "open" ? openItems.length : id === "award" ? awardItems.length : focused.length;

  return (
    <>
      <div className="day-bar tender-toolbar">
        <strong>{focused.length} 条</strong>
        <span>
          在投 {openItems.length} · 中标 {awardItems.length}
          {fiveStar ? ` · 5★ ${fiveStar}` : ""}
        </span>
        <span>同步 {syncedLabel}</span>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: "4px 10px", fontSize: "0.8125rem" }}
          onClick={() => void refresh()}
          disabled={status === "refreshing"}
        >
          {status === "refreshing" ? "刷新中…" : "刷新"}
        </button>
      </div>

      {/* 主体聚焦 */}
      <div className="tender-seg" role="tablist" aria-label="主体聚焦">
        {FOCUS_TABS.map((tab) => {
          const active = focus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              title={tab.hint}
              className={`tender-seg-btn${active ? " is-active" : ""}`}
              onClick={() => setFocus(tab.id)}
            >
              {tab.short}
              <span className="tender-seg-n">{focusCount(tab.id)}</span>
            </button>
          );
        })}
      </div>

      {/* 阶段分类 + 高星 */}
      <div className="tender-filter-row">
        <div className="tender-seg tender-seg-sm" role="tablist" aria-label="阶段分类">
          {STAGE_TABS.map((tab) => {
            const active = stage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`tender-seg-btn${active ? " is-active" : ""}`}
                onClick={() => {
                  setStage(tab.id);
                  setSelectedId(null);
                }}
              >
                {tab.label}
                <span className="tender-seg-n">{stageCount(tab.id)}</span>
              </button>
            );
          })}
        </div>
        <label className="tender-check">
          <input
            type="checkbox"
            checked={highOnly}
            onChange={(e) => {
              setHighOnly(e.target.checked);
              setSelectedId(null);
            }}
          />
          仅 4–5 星
        </label>
      </div>

      {status === "error" ? (
        <div className="note" style={{ marginBottom: 12 }}>
          热更新失败（{error}），仍展示构建期快照。
        </div>
      ) : null}

      {focus === "cta-ai" && stage !== "open" ? (
        <CtaAiAwardAnalysisPanel items={allItems} compact />
      ) : null}
      {focus === "cta-ai" && stage === "open" ? (
        <p className="tender-hint">
          在投招采：点卡片看截止、规模与资格；切换「中标结果」看公示与分析。
        </p>
      ) : null}

      {items.length === 0 ? (
        <article className="card card-pad">
          <h2 className="item-title" style={{ marginTop: 0, fontSize: "1rem" }}>
            当前分类无标讯
          </h2>
          <p className="item-body" style={{ marginBottom: 0 }}>
            试试切换「在投 / 中标 / 全部」，或取消「仅 4–5 星」。
          </p>
        </article>
      ) : (
        <>
          <div className="tender-card-grid">
            {items.map((item) => (
              <TenderCard
                key={item.id}
                item={item}
                focus={focus}
                active={selectedId === item.id}
                onSelect={() =>
                  setSelectedId((cur) => (cur === item.id ? null : item.id))
                }
              />
            ))}
          </div>

          {selected ? (
            <div className="tender-detail-wrap">
              <div className="tender-detail-bar">
                <span className="tender-keylabel">详情</span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: "2px 8px", fontSize: "0.75rem" }}
                  onClick={() => setSelectedId(null)}
                >
                  收起
                </button>
              </div>
              <TenderDetail item={selected} focus={focus} />
            </div>
          ) : (
            <p className="tender-hint tender-hint-muted">点击卡片展开详情</p>
          )}
        </>
      )}
    </>
  );
}
