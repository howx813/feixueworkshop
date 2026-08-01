/**
 * 标讯趋势聚合核心（M2 · 纯函数，不碰 fs，便于单测）
 *
 * 设计依据：docs/p0-tenders-radar-design.md v1.2 §3.2
 * 输入：历史库 JSONL 解析后的行数组（kind:"item" | "meta"）
 * 输出：tender-trends 聚合产物对象（schemaVersion: 1）
 *
 * 口径要点：
 * - 三态：new=firstSeen 在本周；active=出现在最近一次成功快照；expired=缺席最近成功快照
 * - syncOk:false 不判定 expired，顺延到下一次成功快照
 * - byCity/byProfession/moneyBuckets/topBuyers 统计对象 = 按 id 去重后的条目（取最新一行）
 * - byProfession 按「条目×行业出现次数」计，合计 ≠ 条目总数
 * - moneyWan=0 归「未披露」桶，不污染金额统计
 */

const MONEY_BUCKETS = [
  { bucket: "未披露", test: (v) => v <= 0 },
  { bucket: "100万以下", test: (v) => v > 0 && v < 100 },
  { bucket: "100-500万", test: (v) => v >= 100 && v < 500 },
  { bucket: "500-1000万", test: (v) => v >= 500 && v < 1000 },
  { bucket: "1000-5000万", test: (v) => v >= 1000 && v < 5000 },
  { bucket: "5000万以上", test: (v) => v >= 5000 },
];

/** YYYY-MM-DD → ISO 8601 周（周一为一周起点），返回 "2026-W31" */
export function isoWeek(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return "未知";
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = (date.getUTCDay() + 6) % 7; // 周一 = 0
  date.setUTCDate(date.getUTCDate() - day + 3); // 本周周四
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const fd = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fd + 3);
  const week =
    1 + Math.round((date.getTime() - firstThursday.getTime()) / 604800000);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** 一周的起始日期（周一），用于展示与排序 */
export function weekStart(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
}

export function aggregateTenders(rows, { now = new Date() } = {}) {
  const items = rows.filter((r) => r && r.kind === "item" && r.id && r.syncDate);
  const metas = rows
    .filter((r) => r && r.kind === "meta" && r.syncDate)
    .sort((a, b) => String(a.syncDate).localeCompare(String(b.syncDate)));

  // —— 按 id 归并：首见/末见/次数/最新行/出现日期集合 ——
  const byId = new Map();
  for (const r of items) {
    const id = String(r.id);
    let st = byId.get(id);
    if (!st) {
      st = {
        first: r.syncDate,
        last: r.syncDate,
        seen: 0,
        latest: r,
        dates: new Set(),
      };
      byId.set(id, st);
    }
    st.seen += 1;
    st.dates.add(r.syncDate);
    if (r.syncDate < st.first) st.first = r.syncDate;
    if (r.syncDate >= st.last) {
      st.last = r.syncDate;
      st.latest = r;
    }
  }

  // —— 同步健康与三态基准 ——
  const okDates = metas.filter((m) => m.syncOk).map((m) => String(m.syncDate));
  const lastOkDate = okDates.length ? okDates[okDates.length - 1] : "";
  const dataAsOf = metas.length ? String(metas[metas.length - 1].syncDate) : "";
  const firstMetaDate = metas.length ? String(metas[0].syncDate) : "";
  const firstItemDate = items.length
    ? items.map((r) => String(r.syncDate)).sort()[0]
    : "";
  const historyFrom = firstMetaDate && firstItemDate
    ? firstMetaDate < firstItemDate
      ? firstMetaDate
      : firstItemDate
    : firstMetaDate || firstItemDate;

  // active = 出现在最近一次成功快照（syncOk:false 的日子无 item 行，自然顺延）
  const activeIds = new Set(
    items
      .filter((r) => String(r.syncDate) === lastOkDate && lastOkDate)
      .map((r) => String(r.id)),
  );

  // —— 周聚合 ——
  const weeks = new Map();
  const weekOf = (dateStr) => {
    const key = isoWeek(dateStr);
    let w = weeks.get(key);
    if (!w) {
      w = {
        week: key,
        from: weekStart(dateStr),
        newIds: new Set(),
        activeIds: new Set(),
        expiredIds: new Set(),
        fiveStarIds: new Set(),
        moneyById: new Map(), // id → { date, moneyWan }，取周内最新
      };
      weeks.set(key, w);
    }
    return w;
  };

  for (const r of items) {
    const id = String(r.id);
    const w = weekOf(r.syncDate);
    w.activeIds.add(id);
    if ((r.stars || 0) >= 5) w.fiveStarIds.add(id);
    const prev = w.moneyById.get(id);
    if (!prev || r.syncDate >= prev.date) {
      w.moneyById.set(id, { date: r.syncDate, moneyWan: Number(r.moneyWan) || 0 });
    }
  }
  for (const [id, st] of byId) {
    weekOf(st.first).newIds.add(id);
    // expired：全局末见落在该周，且不在最近成功快照里
    if (!activeIds.has(id)) weekOf(st.last).expiredIds.add(id);
  }

  const weekly = [...weeks.values()]
    .sort((a, b) => a.from.localeCompare(b.from))
    .slice(-12)
    .map((w) => ({
      week: w.week,
      from: w.from,
      newCount: w.newIds.size,
      activeCount: w.activeIds.size,
      expiredCount: w.expiredIds.size,
      fiveStarCount: w.fiveStarIds.size,
      totalMoneyWan: [...w.moneyById.values()].reduce(
        (s, v) => s + v.moneyWan,
        0,
      ),
    }));

  // —— 分布（按 id 去重，取最新行）——
  const latestRows = [...byId.values()].map((st) => st.latest);

  const cityMap = new Map();
  const profMap = new Map();
  const buyerMap = new Map();
  const bucketCount = MONEY_BUCKETS.map(() => 0);

  for (const r of latestRows) {
    const city = r.city || "未知";
    const c = cityMap.get(city) || { name: city, count: 0, moneyWan: 0 };
    c.count += 1;
    c.moneyWan += Number(r.moneyWan) || 0;
    cityMap.set(city, c);

    // 条目×行业出现次数：一条挂 N 个行业就在 N 个行业各计 1 次
    for (const p of Array.isArray(r.professions) ? r.professions : []) {
      if (!p) continue;
      profMap.set(p, (profMap.get(p) || 0) + 1);
    }

    const buyer = r.buyer || "未披露";
    buyerMap.set(buyer, (buyerMap.get(buyer) || 0) + 1);

    const money = Number(r.moneyWan) || 0;
    const idx = MONEY_BUCKETS.findIndex((b) => b.test(money));
    if (idx >= 0) bucketCount[idx] += 1;
  }

  const byCity = [...cityMap.values()].sort(
    (a, b) => b.count - a.count || b.moneyWan - a.moneyWan,
  );
  const byProfession = [...profMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const moneyBuckets = MONEY_BUCKETS.map((b, i) => ({
    bucket: b.bucket,
    count: bucketCount[i],
  }));
  const topBuyers = [...buyerMap.entries()]
    .map(([buyer, count]) => ({ buyer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // —— 高星榜单 ——
  const highlights = [...byId.entries()]
    .filter(([, st]) => (st.latest.stars || 0) >= 5)
    .map(([id, st]) => ({
      id,
      title: st.latest.title || "",
      stars: st.latest.stars || 0,
      firstSeenAt: st.first,
      lastSeenAt: st.last,
      seenCount: st.seen,
      moneyWan: Number(st.latest.moneyWan) || 0,
      city: st.latest.city || "",
      buyer: st.latest.buyer || "",
      bidDeadline: st.latest.bidDeadline || "",
      sourceUrl: st.latest.sourceUrl || "",
    }))
    .sort(
      (a, b) =>
        b.firstSeenAt.localeCompare(a.firstSeenAt) || b.stars - a.stars,
    )
    .slice(0, 10);

  const syncHealth = metas
    .slice(-30)
    .map((m) => ({ date: String(m.syncDate), ok: !!m.syncOk }));

  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    historyFrom,
    dataAsOf,
    syncHealth,
    totals: {
      tracked: byId.size,
      active: activeIds.size,
      expired: byId.size - activeIds.size,
    },
    weekly,
    byCity,
    byProfession,
    moneyBuckets,
    topBuyers,
    highlights,
  };
}
