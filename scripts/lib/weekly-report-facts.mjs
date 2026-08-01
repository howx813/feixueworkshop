/**
 * 周报事实层生成核心（M4 · 纯函数，不碰 fs，便于单测）
 *
 * 设计依据：docs/p0-tenders-radar-design.md v1.2 §5.1
 * 输入：历史库行数组 + 目标周（任一属于该周的日期 YYYY-MM-DD）
 * 输出：facts 对象——概览数字 / 值得盯的清单 / 异动候选 / 数据健康
 *
 * 分工：本模块只产出可核对的确定性事实；周报正文（解读）归模型撰写。
 * 口径纪律：行业洞察仅精匹配明细；宽口径计数只用于数据健康，不混用。
 */

import { isoWeek, weekStart } from "./tender-aggregate.mjs";

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

function datesOfWeek(mondayStr) {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayStr, i));
}

/** 归并 byId：首见/末见/最新行/出现日期集（与趋势聚合同口径） */
function groupById(items) {
  const byId = new Map();
  for (const r of items) {
    const id = String(r.id);
    let st = byId.get(id);
    if (!st) {
      st = { first: r.syncDate, last: r.syncDate, latest: r, dates: new Set() };
      byId.set(id, st);
    }
    st.dates.add(r.syncDate);
    if (r.syncDate < st.first) st.first = r.syncDate;
    if (r.syncDate >= st.last) {
      st.last = r.syncDate;
      st.latest = r;
    }
  }
  return byId;
}

/** 某周概览：new/active/expired/5★/披露金额 */
function weekOverview(byId, weekDates, activeIds) {
  const dateSet = new Set(weekDates);
  let newCount = 0;
  let activeCount = 0;
  let expiredCount = 0;
  let fiveStarCount = 0;
  let totalMoneyWan = 0;
  const moneyById = new Map();
  for (const [id, st] of byId) {
    const seenDates = [...st.dates].filter((d) => dateSet.has(d));
    if (dateSet.has(st.first)) newCount += 1;
    if (seenDates.length) activeCount += 1;
    if (dateSet.has(st.last) && !activeIds.has(id)) expiredCount += 1;
    if (seenDates.length && (st.latest.stars || 0) >= 5) fiveStarCount += 1;
    if (seenDates.length) {
      moneyById.set(id, Number(st.latest.moneyWan) || 0);
    }
  }
  for (const v of moneyById.values()) totalMoneyWan += v;
  return { newCount, activeCount, expiredCount, fiveStarCount, totalMoneyWan };
}

/** 某周内见过的条目，按行业/城市计数（条目×标签出现次数） */
function countByTag(byId, weekDates, pick) {
  const dateSet = new Set(weekDates);
  const map = new Map();
  for (const [, st] of byId) {
    const seen = [...st.dates].some((d) => dateSet.has(d));
    if (!seen) continue;
    for (const tag of pick(st.latest)) {
      if (!tag) continue;
      map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  return map;
}

function diffTop(thisMap, prevMap, limit = 5) {
  const tags = new Set([...thisMap.keys(), ...prevMap.keys()]);
  const rows = [...tags].map((name) => ({
    name,
    prev: prevMap.get(name) || 0,
    curr: thisMap.get(name) || 0,
    delta: (thisMap.get(name) || 0) - (prevMap.get(name) || 0),
  }));
  const up = rows
    .filter((r) => r.delta > 0)
    .sort((a, b) => b.delta - a.delta || b.curr - a.curr)
    .slice(0, limit);
  const down = rows
    .filter((r) => r.delta < 0)
    .sort((a, b) => a.delta - b.delta || b.prev - a.prev)
    .slice(0, limit);
  return { up, down };
}

function slimItem(id, st) {
  return {
    id,
    title: st.latest.title || "",
    city: st.latest.city || "",
    buyer: st.latest.buyer || "",
    moneyWan: Number(st.latest.moneyWan) || 0,
    stars: st.latest.stars || 0,
    bidDeadline: st.latest.bidDeadline || "",
    firstSeenAt: st.first,
    lastSeenAt: st.last,
    sourceUrl: st.latest.sourceUrl || "",
  };
}

/**
 * @param rows 历史库行（kind item/meta）
 * @param opts.weekDate 目标周任一日期（YYYY-MM-DD）；通常传「目标周周一」
 * @param opts.now 报告生成时间（临近截止判断基准）
 */
export function weeklyFacts(rows, { weekDate, now = new Date() } = {}) {
  const monday = weekStart(weekDate);
  const sunday = addDays(monday, 6);
  const prevMonday = addDays(monday, -7);
  const week = isoWeek(monday);
  const thisWeekDates = datesOfWeek(monday);
  const prevWeekDates = datesOfWeek(prevMonday);

  const items = rows.filter((r) => r && r.kind === "item" && r.id && r.syncDate);
  const metas = rows
    .filter((r) => r && r.kind === "meta" && r.syncDate)
    .sort((a, b) => String(a.syncDate).localeCompare(String(b.syncDate)));

  const byId = groupById(items);

  const okDates = metas.filter((m) => m.syncOk).map((m) => String(m.syncDate));
  const lastOkDate = okDates.length ? okDates[okDates.length - 1] : "";
  const activeIds = new Set(
    items
      .filter((r) => lastOkDate && String(r.syncDate) === lastOkDate)
      .map((r) => String(r.id)),
  );

  // 环比门槛：历史积累不足 5 天不算环比（设计 §5.1）
  const historyDays = new Set(metas.map((m) => String(m.syncDate))).size;
  const comparable = historyDays >= 5;

  const curr = weekOverview(byId, thisWeekDates, activeIds);
  const prev = weekOverview(byId, prevWeekDates, activeIds);

  // —— 值得盯的项目（以最新成功快照为准）——
  const snapshotItems = [...byId.entries()].filter(([id]) => activeIds.has(id));
  const fiveStar = snapshotItems
    .filter(([, st]) => (st.latest.stars || 0) >= 5)
    .map(([id, st]) => slimItem(id, st))
    .sort((a, b) => b.moneyWan - a.moneyWan);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const deadlineLimit = addDays(todayStr, 10);
  const deadlineSoon = snapshotItems
    .filter(([, st]) => {
      const d = String(st.latest.bidDeadline || "").slice(0, 10);
      return d && d >= todayStr && d <= deadlineLimit;
    })
    .map(([id, st]) => slimItem(id, st))
    .sort((a, b) => a.bidDeadline.localeCompare(b.bidDeadline));

  const bigMoney = snapshotItems
    .filter(([, st]) => Number(st.latest.moneyWan) > 0)
    .map(([id, st]) => slimItem(id, st))
    .sort((a, b) => b.moneyWan - a.moneyWan)
    .slice(0, 5);

  // —— 异动候选（行业 / 地域，环比上周）——
  const profThis = countByTag(byId, thisWeekDates, (r) =>
    Array.isArray(r.professions) ? r.professions : [],
  );
  const profPrev = countByTag(byId, prevWeekDates, (r) =>
    Array.isArray(r.professions) ? r.professions : [],
  );
  const cityThis = countByTag(byId, thisWeekDates, (r) => [r.city || "未知"]);
  const cityPrev = countByTag(byId, prevWeekDates, (r) => [r.city || "未知"]);

  // —— 数据健康（本周 meta 行，宽口径仅此使用）——
  const weekDateSet = new Set(thisWeekDates);
  const health = metas
    .filter((m) => weekDateSet.has(String(m.syncDate)))
    .map((m) => ({
      date: String(m.syncDate),
      ok: !!m.syncOk,
      rawCount: m.rawCount ?? 0,
      softwareCount: m.softwareCount ?? 0,
      matchedCount: m.matchedCount ?? 0,
      fiveStarCount: m.fiveStarCount ?? 0,
      error: m.error || "",
    }));

  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    week,
    range: { from: monday, to: sunday },
    historyDays,
    comparable,
    dataAsOf: metas.length ? String(metas[metas.length - 1].syncDate) : "",
    overview: {
      curr,
      prev: comparable ? prev : null,
      delta: comparable
        ? {
            newCount: curr.newCount - prev.newCount,
            activeCount: curr.activeCount - prev.activeCount,
            expiredCount: curr.expiredCount - prev.expiredCount,
            fiveStarCount: curr.fiveStarCount - prev.fiveStarCount,
            totalMoneyWan: curr.totalMoneyWan - prev.totalMoneyWan,
          }
        : null,
    },
    watch: { fiveStar, deadlineSoon, bigMoney },
    movers: {
      professions: diffTop(profThis, profPrev),
      cities: diffTop(cityThis, cityPrev),
    },
    health,
    tracked: byId.size,
  };
}
