/**
 * 站点周报生成器：工作周报（/weekly 页面数据源）
 *
 * 需求（飞雪 2026-08-01 v2）：周报 = 飞雪的一周工作，内容主体来自 Hermes
 * （飞雪每周工作大量与 DeepSeek 在 Hermes 沟通）；标讯内容不进周报。
 *
 * 合并契约：
 *   docs/weekly-hub/<week>.work.md   DeepSeek 撰写的工作周报正文（markdown-lite）★ 主体
 *   data/agent-activity.jsonl        K3 侧运行记账（页脚数据健康一行）
 *
 * 用法:
 *   npm run tenders:weekly-site                 # 默认当前周（周五 18:00 跑）
 *   node scripts/weekly-site-report.mjs --week=2026-W31
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isoWeek, weekStart } from "./lib/tender-aggregate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function localDateStr(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function readWorkText(week) {
  try {
    const p = path.join(root, "docs", "weekly-hub", `${week}.work.md`);
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8").trim();
  } catch {
    // 缺正文不阻断
  }
  return "";
}

function readActivityWeek(from, to) {
  try {
    const file = path.join(root, "data", "agent-activity.jsonl");
    if (!fs.existsSync(file)) return [];
    return fs
      .readFileSync(file, "utf8")
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter((e) => e && e.ts && e.ts.slice(0, 10) >= from && e.ts.slice(0, 10) <= to);
  } catch {
    return [];
  }
}

export function runWeeklySite({ weekArg, quiet = false } = {}) {
  const weekDate = weekArg || localDateStr();
  const monday = weekStart(weekDate);
  const week = isoWeek(monday);
  const range = { from: monday, to: addDays(monday, 6) };

  const workText = readWorkText(week);
  const activities = readActivityWeek(range.from, range.to);
  const okRuns = activities.filter((a) => a.ok).length;

  const healthLine = activities.length
    ? `工坊 AI 本周运行 ${activities.length} 次（成功 ${okRuns} / 失败 ${activities.length - okRuns}）`
    : "";

  const copyParts = [
    `【工作周报 ${week}】${range.from} ~ ${range.to}`,
    "",
    workText || "（本周正文待补充）",
  ];
  if (healthLine) copyParts.push("", healthLine);
  copyParts.push("", "—— 飞雪工坊");

  const report = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    week,
    range,
    hasWork: !!workText,
    workText,
    health: {
      agentRuns: activities.length,
      agentOk: okRuns,
      line: healthLine,
    },
    copyText: copyParts.join("\n"),
  };

  const outPath = path.join(root, "public/data/weekly-report.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (!quiet) {
    console.log(
      `工作周报 ${week}（${range.from} ~ ${range.to}）：正文${workText ? `已合并（${workText.length} 字）` : `缺（等待 docs/weekly-hub/${week}.work.md）`} · AI 运行 ${activities.length} 次`,
    );
    console.log(`→ ${path.relative(root, outPath)}`);
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = process.argv.find((a) => a.startsWith("--week="));
  runWeeklySite({ weekArg: arg ? arg.slice(7) : undefined });
}
