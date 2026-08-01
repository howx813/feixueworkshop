/**
 * 站点周报生成器：历史库 → public/data/weekly-report.json（/weekly 页面数据源）
 *
 * 需求（飞雪 2026-08-01）：每周五 18:00 更新；结合双方数据底座；
 * 页面密码门 + 一键复制；风格简单明了。
 *
 * 数据合并口：
 *   - K3 侧：标讯历史库（weeklyFacts）+ data/agent-activity.jsonl（运行记账）
 *   - DeepSeek / 模型侧（可选，存在才合并）：
 *       docs/weekly-bid-reports/<week>.insight.md   → 解读段落（模型撰写）
 *
 * 用法:
 *   npm run tenders:weekly-site                 # 默认当前周（周五 18:00 跑）
 *   node scripts/weekly-site-report.mjs --week=2026-W31
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readHistoryRows } from "./aggregate-tenders.mjs";
import { weeklyFacts } from "./lib/weekly-report-facts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function localDateStr(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtWan(wan) {
  if (!wan || wan <= 0) return "未披露";
  if (wan >= 10000) return `${(wan / 10000).toFixed(1).replace(/\.0$/, "")} 亿`;
  return `${wan} 万`;
}

function sign(n) {
  return n > 0 ? `+${n}` : String(n);
}

function readInsight(week) {
  try {
    const p = path.join(root, "docs", "weekly-bid-reports", `${week}.insight.md`);
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8").trim();
  } catch {
    // 缺解读不阻断
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

function slim(it) {
  return {
    title: it.title,
    city: it.city || "—",
    moneyText: fmtWan(it.moneyWan),
    bidDeadline: it.bidDeadline || "未写明",
    firstSeenAt: it.firstSeenAt,
    sourceUrl: it.sourceUrl || "",
  };
}

/** 一键复制的纯文本摘要（简单明了，适配飞书/微信粘贴） */
export function buildCopyText(r) {
  const L = [];
  L.push(`【招标周报 ${r.week}】${r.range.from} ~ ${r.range.to}`);
  L.push("");
  if (r.insight) {
    L.push(r.insight);
    L.push("");
  }
  const o = r.overview;
  L.push(
    `本周：新增 ${o.newCount} · 在途 ${o.activeCount} · 5★ ${o.fiveStarCount} · 披露金额 ${fmtWan(o.totalMoneyWan)}`,
  );
  if (!o.comparable) L.push(`（数据积累中，已 ${o.historyDays} 天，暂无环比）`);
  L.push("");
  if (r.fiveStar.length) {
    L.push("◆ 5★ 项目");
    for (const it of r.fiveStar) {
      L.push(`· ${it.title}｜${it.city}｜${it.moneyText}｜截止 ${it.bidDeadline}`);
    }
    L.push("");
  }
  if (r.deadlineSoon.length) {
    L.push("◆ 临近截止");
    for (const it of r.deadlineSoon) {
      L.push(`· ${it.title}｜${it.city}｜截止 ${it.bidDeadline}`);
    }
    L.push("");
  }
  if (r.moversUp.length) {
    L.push(`◆ 异动升温：${r.moversUp.map((m) => `${m.name} ${sign(m.delta)}`).join("、")}`);
    L.push("");
  }
  L.push(`数据健康：同步 ${r.health.days} 天，成功 ${r.health.ok} / 失败 ${r.health.fail}`);
  L.push("—— 飞雪工坊 · 标讯雷达");
  return L.join("\n");
}

export function runWeeklySite({ weekArg, quiet = false } = {}) {
  const weekDate = weekArg || localDateStr();
  const { rows } = readHistoryRows();
  const f = weeklyFacts(rows, { weekDate });

  const activities = readActivityWeek(f.range.from, f.range.to);
  const okDays = activities.filter((a) => a.ok).length;

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    week: f.week,
    range: f.range,
    insight: readInsight(f.week),
    overview: {
      newCount: f.overview.curr.newCount,
      activeCount: f.overview.curr.activeCount,
      expiredCount: f.overview.curr.expiredCount,
      fiveStarCount: f.overview.curr.fiveStarCount,
      totalMoneyWan: f.overview.curr.totalMoneyWan,
      comparable: f.comparable,
      historyDays: f.historyDays,
    },
    fiveStar: f.watch.fiveStar.slice(0, 3).map(slim),
    deadlineSoon: f.watch.deadlineSoon.slice(0, 5).map(slim),
    // 积累期（无环比基准）不展示异动，避免「+53」式虚高
    moversUp: f.comparable
      ? [
          ...f.movers.professions.up.slice(0, 3),
          ...f.movers.cities.up.slice(0, 2),
        ].slice(0, 5)
      : [],
    health: {
      days: new Set(f.health.map((h) => h.date)).size,
      ok: new Set(f.health.filter((h) => h.ok).map((h) => h.date)).size,
      fail: new Set(f.health.filter((h) => !h.ok).map((h) => h.date)).size,
      agentRuns: activities.length,
      agentOk: okDays,
    },
    dataAsOf: f.dataAsOf,
  };
  report.copyText = buildCopyText(report);

  const outPath = path.join(root, "public/data/weekly-report.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  if (!quiet) {
    console.log(
      `站点周报 ${report.week}：新增 ${report.overview.newCount} / 5★ ${report.overview.fiveStarCount} / 解读${report.insight ? "已合并" : "缺（可写 docs/weekly-bid-reports/" + report.week + ".insight.md）"}`,
    );
    console.log(`→ ${path.relative(root, outPath)}`);
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = process.argv.find((a) => a.startsWith("--week="));
  runWeeklySite({ weekArg: arg ? arg.slice(7) : undefined });
}
