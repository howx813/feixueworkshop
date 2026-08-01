/**
 * 聚合标讯历史库 → 趋势产物（M2）
 *
 * 设计依据：docs/p0-tenders-radar-design.md v1.2 §3.2 / §3.3
 *
 * 产物（双写，同方案 C 模式）：
 *   src/data/tender-trends.generated.json   构建期首屏
 *   public/data/tender-trends.json          运行时热刷
 *   public/data/agent-activity.json         日报卡片热刷（最近 30 条，倒序）
 *
 * 用法:
 *   npm run tenders:aggregate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aggregateTenders } from "./lib/tender-aggregate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const HISTORY_DIR = path.join(root, "data", "tenders-history");
const ACTIVITY_FILE = path.join(root, "data", "agent-activity.jsonl");

/** 读全部历史行（坏行容错，单行失败不阻断整体聚合） */
export function readHistoryRows(dir = HISTORY_DIR) {
  const rows = [];
  let badLines = 0;
  if (!fs.existsSync(dir)) return { rows, badLines };
  const files = fs
    .readdirSync(dir)
    .filter((n) => /^\d{4}-\d{2}\.jsonl$/.test(n))
    .sort();
  for (const name of files) {
    const text = fs.readFileSync(path.join(dir, name), "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      try {
        rows.push(JSON.parse(t));
      } catch {
        badLines += 1;
      }
    }
  }
  return { rows, badLines };
}

function readActivityEntries(file = ACTIVITY_FILE, limit = 30) {
  if (!fs.existsSync(file)) return [];
  const entries = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      entries.push(JSON.parse(t));
    } catch {
      // 坏行跳过
    }
  }
  return entries.slice(-limit).reverse(); // 新在前
}

function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
}

export function runAggregate({ quiet = false } = {}) {
  const { rows, badLines } = readHistoryRows();
  const trends = aggregateTenders(rows);
  const activity = {
    schemaVersion: 1,
    generatedAt: trends.generatedAt,
    entries: readActivityEntries(),
  };

  const trendsSrc = path.join(root, "src/data/tender-trends.generated.json");
  const trendsPub = path.join(root, "public/data/tender-trends.json");
  const activityPub = path.join(root, "public/data/agent-activity.json");
  writeJson(trendsSrc, trends);
  writeJson(trendsPub, trends);
  writeJson(activityPub, activity);

  if (!quiet) {
    console.log(
      `聚合完成：跟踪 ${trends.totals.tracked} 条（在途 ${trends.totals.active} / 出窗 ${trends.totals.expired}），` +
        `周数 ${trends.weekly.length}，数据截至 ${trends.dataAsOf || "—"}`,
    );
    console.log(
      `双写 → ${path.relative(root, trendsSrc)} + ${path.relative(root, trendsPub)}；` +
        `activity ${activity.entries.length} 条 → ${path.relative(root, activityPub)}`,
    );
    if (badLines > 0) {
      console.warn(`警告：跳过 ${badLines} 行坏数据（已容错，不阻断）`);
    }
    if (rows.length === 0) {
      console.warn("警告：历史库为空，产物为空态（先跑 npm run tenders:sync）");
    }
  }
  return { trends, activity, badLines };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAggregate();
}
