/**
 * 标讯历史库单测（M1 · 纯事件溯源）
 * 直接测 scripts/lib/tender-history.mjs，临时目录隔离，不碰真实 data/。
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  activityFile,
  appendActivity,
  appendHistory,
  historyFileFor,
  loadKnownIds,
  localDate,
  toItemLine,
} from "./lib/tender-history.mjs";

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tender-hist-"));
}

function readLines(file) {
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

// —— 1. 首次追加：按月分片建文件，item 行 + 末尾 meta 行 ——
{
  const root = tmpRoot();
  const items = [
    {
      id: "a1",
      title: "某信息系统建设项目",
      tenderType: "招采",
      date: "2026-07-29",
      province: "贵州省",
      city: "贵阳市",
      buyer: "某单位",
      moneyWan: 320,
      professions: ["系统集成", "信息化"],
      stars: 4,
      score: 12,
      stageName: "招标公告",
      bidDeadline: "2026-08-07 09:30",
      sourceUrl: "https://example.com/a1",
      // 这些字段不该进历史库
      deepAnalysis: { summary: "长文……" },
      _detail: { raw: "内部对象" },
    },
    { id: "b2", title: "另一条", stars: 2, score: 5 },
  ];
  const { file, itemLines } = appendHistory(root, {
    items,
    meta: {
      rawCount: 100,
      softwareCount: 90,
      matchedCount: 2,
      fiveStarCount: 0,
      syncOk: true,
    },
    syncDate: "2026-08-01",
  });
  assert.equal(itemLines, 2);
  assert.equal(file, historyFileFor(root, "2026-08-01"));
  assert.ok(file.endsWith(path.join("2026-08.jsonl")));

  const lines = readLines(file);
  assert.equal(lines.length, 3, "2 条 item + 1 条 meta");
  const [l1, l2, meta] = lines;
  assert.equal(l1.kind, "item");
  assert.equal(l1.id, "a1");
  assert.equal(l1.syncDate, "2026-08-01");
  assert.equal(l1.moneyWan, 320);
  assert.deepEqual(l1.professions, ["系统集成", "信息化"]);
  assert.equal(l1.deepAnalysis, undefined, "deepAnalysis 不进库");
  assert.equal(l1._detail, undefined, "内部字段不进库");
  assert.equal(l2.moneyWan, 0, "缺省 moneyWan 归 0");
  assert.deepEqual(l2.professions, []);
  assert.equal(meta.kind, "meta");
  assert.equal(meta.syncOk, true);
  assert.equal(meta.rawCount, 100);
  console.log("ok 1. 首次追加 + 字段裁剪 + 月分片");
}

// —— 2. 纯追加：同日二次同步不重写、旧行原样保留 ——
{
  const root = tmpRoot();
  const meta = {
    rawCount: 1,
    softwareCount: 1,
    matchedCount: 1,
    fiveStarCount: 0,
    syncOk: true,
  };
  appendHistory(root, {
    items: [{ id: "x", title: "第一次", stars: 3, score: 1 }],
    meta,
    syncDate: "2026-08-01",
  });
  const file = historyFileFor(root, "2026-08-01");
  const before = fs.readFileSync(file, "utf8");
  appendHistory(root, {
    items: [{ id: "x", title: "第一次", stars: 3, score: 1 }],
    meta,
    syncDate: "2026-08-01",
  });
  const after = fs.readFileSync(file, "utf8");
  assert.ok(after.startsWith(before), "旧内容原样保留（纯追加）");
  assert.equal(readLines(file).length, 4, "两轮各 1 item + 1 meta");
  console.log("ok 2. 纯追加重写禁忌");
}

// —— 3. 跨月分片：syncDate 决定文件名 ——
{
  const root = tmpRoot();
  const meta = { rawCount: 0, softwareCount: 0, matchedCount: 0, fiveStarCount: 0, syncOk: true };
  appendHistory(root, { items: [{ id: "m1" }], meta, syncDate: "2026-07-31" });
  appendHistory(root, { items: [{ id: "m2" }], meta, syncDate: "2026-08-01" });
  assert.ok(fs.existsSync(path.join(root, "data", "tenders-history", "2026-07.jsonl")));
  assert.ok(fs.existsSync(path.join(root, "data", "tenders-history", "2026-08.jsonl")));
  console.log("ok 3. 跨月分片");
}

// —— 4. loadKnownIds：跨月收集、忽略 meta、坏行容错 ——
{
  const root = tmpRoot();
  const meta = { rawCount: 0, softwareCount: 0, matchedCount: 0, fiveStarCount: 0, syncOk: true };
  appendHistory(root, { items: [{ id: "k1" }, { id: 12345 }], meta, syncDate: "2026-07-15" });
  appendHistory(root, { items: [{ id: "k2" }], meta, syncDate: "2026-08-01" });
  // 注入坏行与非分片文件
  const bad = historyFileFor(root, "2026-08-01");
  fs.appendFileSync(bad, "这不是 json\n{\"kind\":\"item\"\n");
  fs.writeFileSync(path.join(root, "data", "tenders-history", "README.txt"), "ignore me");

  const ids = loadKnownIds(root);
  assert.ok(ids.has("k1") && ids.has("k2"));
  assert.ok(ids.has("12345"), "数字 id 归一为字符串");
  assert.equal(ids.size, 3, "meta 行不产生 id、坏行被跳过");
  console.log("ok 4. loadKnownIds 容错与归一");
}

// —— 5. activity 记账：默认字段 + 追加 ——
{
  const root = tmpRoot();
  appendActivity(root, { ok: true, newCount: 3, activeCount: 80, artifacts: ["a"], note: "" });
  appendActivity(root, { ok: false, newCount: 0, activeCount: 0, artifacts: [], note: "API 超时" });
  const lines = readLines(activityFile(root));
  assert.equal(lines.length, 2);
  assert.equal(lines[0].agent, "tenders-sync");
  assert.ok(lines[0].ts, "自动补 ts");
  assert.equal(lines[1].ok, false);
  assert.equal(lines[1].note, "API 超时");
  console.log("ok 5. activity 记账");
}

// —— 6. localDate / toItemLine 边界 ——
{
  assert.match(localDate(new Date(2026, 0, 5)), /^2026-01-05$/);
  const line = toItemLine({}, "2026-08-01");
  assert.equal(line.id, "", "缺 id 归空串而非 'undefined'");
  assert.equal(line.title, "");
  assert.equal(line.stars, 0);
  console.log("ok 6. 边界默认值");
}

console.log("tender-history 全部通过");
