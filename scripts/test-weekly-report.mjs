/**
 * 周报事实层单测（M4）
 * 对照 docs/p0-tenders-radar-design.md v1.2 §5.1：环比门槛、口径纪律、异动候选
 */
import assert from "node:assert/strict";
import { weeklyFacts } from "./lib/weekly-report-facts.mjs";
import { isoWeekMonday, renderMarkdown } from "./weekly-bid-report.mjs";

function item(id, syncDate, extra = {}) {
  return {
    kind: "item",
    id,
    syncDate,
    title: `项目${id}`,
    tenderType: "招采",
    date: syncDate,
    province: "贵州省",
    city: "贵阳市",
    buyer: "某单位",
    moneyWan: 0,
    professions: [],
    stars: 3,
    score: 5,
    stageName: "",
    bidDeadline: "",
    sourceUrl: "https://example.com/" + id,
    ...extra,
  };
}
function meta(syncDate, syncOk = true) {
  return { kind: "meta", syncDate, rawCount: 100, softwareCount: 90, matchedCount: 10, fiveStarCount: 1, syncOk };
}

// 构造两周历史：W30（07-20~07-26）+ W31（07-27~08-02）
function twoWeekRows() {
  const rows = [];
  for (let d = 20; d <= 26; d += 1) rows.push(meta(`2026-07-${d}`));
  for (let d = 27; d <= 31; d += 1) rows.push(meta(`2026-07-${d}`));
  rows.push(meta("2026-08-01"));
  // W30：P1 首见（遵义 / 系统集成 / 100万）
  rows.push(item("P1", "2026-07-22", { city: "遵义市", professions: ["系统集成"], moneyWan: 100 }));
  // W31：P1 仍在窗；N1 新见（贵阳 / 双行业 / 5★ / 800万 / 10 天内截止）
  rows.push(item("P1", "2026-07-28", { city: "遵义市", professions: ["系统集成"], moneyWan: 100 }));
  rows.push(
    item("N1", "2026-07-28", {
      professions: ["系统集成", "信息化"],
      stars: 5,
      moneyWan: 800,
      bidDeadline: "2026-08-07 09:30",
    }),
  );
  rows.push(
    item("N1", "2026-08-01", {
      professions: ["系统集成", "信息化"],
      stars: 5,
      moneyWan: 800,
      bidDeadline: "2026-08-07 09:30",
    }),
  );
  return rows;
}

const NOW = new Date(2026, 7, 1, 10, 0, 0); // 2026-08-01（周六）

// —— 1. ISO 周反解 ——
{
  assert.equal(isoWeekMonday("2026-W31"), "2026-07-27");
  assert.equal(isoWeekMonday("2026-W01"), "2025-12-29", "W01 周一可能落在前一年");
  console.log("ok 1. ISO 周反解");
}

// —— 2. 周概览 + 环比（积累足够时）——
{
  const f = weeklyFacts(twoWeekRows(), { weekDate: "2026-07-27", now: NOW });
  assert.equal(f.week, "2026-W31");
  assert.deepEqual(f.range, { from: "2026-07-27", to: "2026-08-02" });
  assert.equal(f.comparable, true, "13 天积累应开启环比");
  const c = f.overview.curr;
  assert.equal(c.newCount, 1, "本周新见仅 N1");
  assert.equal(c.activeCount, 2, "P1、N1 本周内在窗");
  assert.equal(c.expiredCount, 1, "P1 末见 07-28 且不在 08-01 快照");
  assert.equal(c.fiveStarCount, 1);
  assert.equal(c.totalMoneyWan, 900);
  assert.equal(f.overview.prev.newCount, 1, "上周新见 P1");
  assert.equal(f.overview.delta.newCount, 0);
  console.log("ok 2. 周概览与环比");
}

// —— 3. 值得盯的清单：5★ / 临近截止 / 大额 ——
{
  const f = weeklyFacts(twoWeekRows(), { weekDate: "2026-08-02", now: NOW });
  assert.deepEqual(f.watch.fiveStar.map((x) => x.id), ["N1"]);
  assert.deepEqual(f.watch.deadlineSoon.map((x) => x.id), ["N1"], "08-07 在 10 天窗口内");
  assert.equal(f.watch.bigMoney[0].id, "N1", "800万为大额榜首");
  assert.equal(f.watch.deadlineSoon[0].firstSeenAt, "2026-07-28");
  console.log("ok 3. 值得盯清单");
}

// —— 4. 异动候选：行业/地域环比 ——
{
  const f = weeklyFacts(twoWeekRows(), { weekDate: "2026-07-30", now: NOW });
  const upNames = f.movers.professions.up.map((r) => r.name);
  assert.ok(upNames.includes("信息化"), "信息化 0→1 应升温");
  const info = f.movers.professions.up.find((r) => r.name === "信息化");
  assert.deepEqual([info.prev, info.curr, info.delta], [0, 1, 1]);
  const cityUp = f.movers.cities.up.map((r) => r.name);
  assert.ok(cityUp.includes("贵阳市"), "贵阳 0→1 升温");
  console.log("ok 4. 异动候选");
}

// —— 5. 环比门槛：积累 < 5 天不出环比，Markdown 标注 ——
{
  const rows = [meta("2026-07-31"), meta("2026-08-01"), meta("2026-08-02"), item("Q", "2026-08-01")];
  const f = weeklyFacts(rows, { weekDate: "2026-08-01", now: NOW });
  assert.equal(f.historyDays, 3);
  assert.equal(f.comparable, false);
  assert.equal(f.overview.prev, null);
  assert.equal(f.overview.delta, null);
  const md = renderMarkdown(f);
  assert.ok(md.includes("环比：无（数据积累中"), "首期须标注无环比");
  console.log("ok 5. 环比门槛 + 首期标注");
}

// —— 6. Markdown 骨架：事实层齐全 + 解读占位 + 口径纪律 ——
{
  const f = weeklyFacts(twoWeekRows(), { weekDate: "2026-07-27", now: NOW });
  const md = renderMarkdown(f);
  assert.ok(md.includes("# 招标趋势周报 · 2026-W31（2026-07-27 ~ 2026-08-02）"));
  assert.ok(md.includes("🤖 待模型撰写"), "解读占位必须在");
  assert.ok(md.includes("环比上周"), "有环比时展示环比行");
  assert.ok(md.includes("新增 1 条 · 在途 2 条"));
  assert.ok(md.includes("项目N1"));
  assert.ok(md.includes("行业洞察仅精匹配口径") || md.includes("行业分布为精匹配条目口径"), "口径纪律上墙");
  assert.ok(md.includes("同步 6 天：成功 6 / 失败 0"));
  assert.ok(md.includes("## 四、数据健康"));
  console.log("ok 6. Markdown 骨架");
}

// —— 7. 数据健康含失败日 ——
{
  const rows = twoWeekRows();
  rows.push(meta("2026-08-02", false));
  const f = weeklyFacts(rows, { weekDate: "2026-07-27", now: NOW });
  const failDay = f.health.find((h) => h.date === "2026-08-02");
  assert.equal(failDay.ok, false);
  assert.equal(f.health.filter((h) => h.ok).length, 6);
  console.log("ok 7. 健康记录含失败日");
}

console.log("weekly-report 全部通过");
