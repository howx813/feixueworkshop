/**
 * 标讯趋势聚合单测（M2）
 * 纯函数测 scripts/lib/tender-aggregate.mjs；IO 读取用临时目录。
 * 口径对照 docs/p0-tenders-radar-design.md v1.2 §3.2
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  aggregateTenders,
  isoWeek,
  weekStart,
} from "./lib/tender-aggregate.mjs";
import { readHistoryRows } from "./aggregate-tenders.mjs";

function item(id, syncDate, extra = {}) {
  return {
    kind: "item",
    id,
    syncDate,
    title: `标讯${id}`,
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
    sourceUrl: "",
    ...extra,
  };
}
function meta(syncDate, syncOk = true, extra = {}) {
  return {
    kind: "meta",
    syncDate,
    rawCount: 100,
    softwareCount: 90,
    matchedCount: 10,
    fiveStarCount: 1,
    syncOk,
    ...extra,
  };
}

// —— 1. ISO 周与周起点 ——
{
  assert.equal(isoWeek("2026-08-01"), "2026-W31", "2026-08-01 周六属 W31");
  assert.equal(weekStart("2026-08-01"), "2026-07-27", "W31 周一是 07-27");
  assert.equal(isoWeek("2026-01-01"), "2026-W01");
  console.log("ok 1. ISO 周计算");
}

// —— 2. 三态口径：new / active / expired ——
{
  // day1：A、B 在快照；day2：A、C 在快照（B 出窗，C 新见）
  const rows = [
    item("A", "2026-07-27"), item("B", "2026-07-27"),
    meta("2026-07-27"),
    item("A", "2026-07-28"), item("C", "2026-07-28"),
    meta("2026-07-28"),
  ];
  const t = aggregateTenders(rows, { now: new Date("2026-07-29T00:00:00Z") });
  assert.equal(t.totals.tracked, 3);
  assert.equal(t.totals.active, 2, "A、C 在最近成功快照");
  assert.equal(t.totals.expired, 1, "B 出窗");
  assert.equal(t.dataAsOf, "2026-07-28");
  assert.equal(t.historyFrom, "2026-07-27");

  const w = t.weekly.find((x) => x.week === "2026-W31");
  assert.equal(w.newCount, 3, "三条都首见于本周");
  assert.equal(w.activeCount, 3, "本周内见过都算周内在途");
  assert.equal(w.expiredCount, 1, "B 末见落在本周且不在最近快照");
  console.log("ok 2. 三态口径");
}

// —— 3. syncOk:false 顺延：失败日不判定 expired ——
{
  // day1：A、B；day2 抓取失败（无 item 行）；day3：只有 A
  const rows = [
    item("A", "2026-07-27"), item("B", "2026-07-27"),
    meta("2026-07-27"),
    meta("2026-07-28", false, { error: "API 超时" }),
    item("A", "2026-07-29"),
    meta("2026-07-29"),
  ];
  const t = aggregateTenders(rows);
  assert.equal(t.totals.active, 1, "active 相对最近一次成功快照（07-29）");
  assert.equal(t.totals.expired, 1, "仅 B 出窗；失败日（07-28）不产生误判");
  assert.deepEqual(
    t.syncHealth,
    [
      { date: "2026-07-27", ok: true },
      { date: "2026-07-28", ok: false },
      { date: "2026-07-29", ok: true },
    ],
  );
  assert.equal(t.dataAsOf, "2026-07-29", "dataAsOf 取最近 meta（含失败日）");
  console.log("ok 3. syncOk:false 顺延 + 健康记录");
}

// —— 4. 多行业计数口径：条目×行业出现次数 ——
{
  const rows = [
    item("X", "2026-08-01", { professions: ["系统集成", "信息化"] }),
    item("Y", "2026-08-01", { professions: ["系统集成"] }),
    item("Z", "2026-08-01", { professions: [] }),
    meta("2026-08-01"),
  ];
  const t = aggregateTenders(rows);
  const sys = t.byProfession.find((p) => p.name === "系统集成");
  const info = t.byProfession.find((p) => p.name === "信息化");
  assert.equal(sys.count, 2, "X、Y 各计一次");
  assert.equal(info.count, 1);
  const sum = t.byProfession.reduce((s, p) => s + p.count, 0);
  assert.equal(sum, 3, "合计 3 ≠ 条目数 3（X 挂了 2 个行业）——口径为出现次数");
  assert.equal(t.totals.tracked, 3);
  console.log("ok 4. 多行业出现次数口径");
}

// —— 5. 分布统计按 id 去重（取最新行）+ 金额分桶 ——
{
  const rows = [
    item("M", "2026-07-27", { city: "遵义市", moneyWan: 0 }),
    item("M", "2026-07-28", { city: "贵阳市", moneyWan: 450, buyer: "甲方A" }),
    item("N", "2026-07-28", { city: "贵阳市", moneyWan: 6000, buyer: "甲方A" }),
    item("O", "2026-07-28", { city: "贵阳市", moneyWan: 60, buyer: "甲方B" }),
    meta("2026-07-27"),
    meta("2026-07-28"),
  ];
  const t = aggregateTenders(rows);
  const gy = t.byCity.find((c) => c.name === "贵阳市");
  assert.equal(gy.count, 3, "M 只按最新行计 1 次，不按快照行数");
  assert.equal(gy.moneyWan, 450 + 6000 + 60);
  assert.equal(t.byCity.find((c) => c.name === "遵义市"), undefined, "旧行城市不重复计");

  const bucket = Object.fromEntries(t.moneyBuckets.map((b) => [b.bucket, b.count]));
  assert.equal(bucket["100-500万"], 1);
  assert.equal(bucket["5000万以上"], 1);
  assert.equal(bucket["100万以下"], 1);
  assert.equal(bucket["未披露"], 0, "最新行已带金额，不再归未披露");

  assert.deepEqual(t.topBuyers[0], { buyer: "甲方A", count: 2 });
  console.log("ok 5. 去重统计 + 金额分桶");
}

// —— 6. 高星榜单：stars≥5，含 firstSeen/seenCount，按首见倒序 ——
{
  const rows = [
    item("S1", "2026-07-20", { stars: 5 }),
    item("S1", "2026-07-21", { stars: 5 }),
    item("S2", "2026-07-25", { stars: 5 }),
    item("S3", "2026-07-25", { stars: 4 }),
    meta("2026-07-21"),
    meta("2026-07-25"),
  ];
  const t = aggregateTenders(rows);
  assert.equal(t.highlights.length, 2, "4★ 不进榜");
  assert.equal(t.highlights[0].id, "S2", "首见晚的排前");
  assert.equal(t.highlights[1].seenCount, 2);
  assert.equal(t.highlights[1].firstSeenAt, "2026-07-20");
  console.log("ok 6. 高星榜单");
}

// —— 7. 周金额取周内最新行 + 周窗口保留 12 周 ——
{
  const rows = [];
  for (let i = 0; i < 14; i += 1) {
    const d = `2026-0${1 + Math.floor(i / 7)}-0${(i % 7) + 1}`;
    rows.push(item("W", d, { moneyWan: i * 100 }));
    rows.push(meta(d));
  }
  const t = aggregateTenders(rows);
  assert.ok(t.weekly.length <= 12, "最多保留 12 周");
  const lastWeek = t.weekly[t.weekly.length - 1];
  assert.ok(lastWeek.totalMoneyWan > 0);
  console.log("ok 7. 周窗口截断");
}

// —— 8. IO：readHistoryRows 跨月读取 + 坏行容错 ——
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tender-agg-"));
  fs.writeFileSync(
    path.join(dir, "2026-07.jsonl"),
    `${JSON.stringify(item("I1", "2026-07-31"))}\n${JSON.stringify(meta("2026-07-31"))}\n坏行\n`,
  );
  fs.writeFileSync(
    path.join(dir, "2026-08.jsonl"),
    `${JSON.stringify(item("I2", "2026-08-01"))}\n`,
  );
  fs.writeFileSync(path.join(dir, "notes.txt"), "忽略非分片文件");
  const { rows, badLines } = readHistoryRows(dir);
  assert.equal(rows.length, 3);
  assert.equal(badLines, 1);
  const t = aggregateTenders(rows);
  assert.equal(t.totals.tracked, 2);
  assert.equal(t.historyFrom, "2026-07-31");
  console.log("ok 8. IO 读取 + 坏行容错");
}

// —— 9. 空历史库：产物为空态不抛错 ——
{
  const t = aggregateTenders([]);
  assert.equal(t.totals.tracked, 0);
  assert.deepEqual(t.weekly, []);
  assert.equal(t.dataAsOf, "");
  assert.equal(t.schemaVersion, 1);
  console.log("ok 9. 空态容错");
}

console.log("tender-aggregate 全部通过");
