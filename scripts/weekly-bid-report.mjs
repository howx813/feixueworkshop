/**
 * 周报底座生成器（M4）：历史库 → 事实层 facts.json + 周报 Markdown 骨架
 *
 * 设计依据：docs/p0-tenders-radar-design.md v1.2 §5.1
 * 分工：脚本产事实层（确定性数字与清单），「本周解读」占位由模型撰写。
 *
 * 用法:
 *   npm run tenders:weekly                    # 默认：上一个完整周（周一跑即报上周）
 *   node scripts/weekly-bid-report.mjs --week=current   # 本周（积累中）
 *   node scripts/weekly-bid-report.mjs --week=2026-W31  # 指定周
 *
 * 产物:
 *   docs/weekly-bid-reports/YYYY-Www.facts.json   模型撰写正文的结构化输入
 *   docs/weekly-bid-reports/YYYY-Www.md           周报骨架（事实层已填，解读占位）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readHistoryRows } from "./aggregate-tenders.mjs";
import { isoWeek, weekStart } from "./lib/tender-aggregate.mjs";
import { weeklyFacts } from "./lib/weekly-report-facts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const OUT_DIR = path.join(root, "docs", "weekly-bid-reports");

function localDateStr(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** ISO 周字符串 → 该周周一（如 2026-W31 → 2026-07-27） */
export function isoWeekMonday(weekStr) {
  const m = String(weekStr).match(/^(\d{4})-W(\d{2})$/);
  if (!m) throw new Error(`无法解析周：${weekStr}`);
  const year = Number(m[1]);
  const week = Number(m[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = (jan4.getUTCDay() + 6) % 7; // 周一 = 0
  const week1Monday = new Date(Date.UTC(year, 0, 4 - day));
  const monday = new Date(week1Monday.getTime() + (week - 1) * 7 * 86400000);
  return monday.toISOString().slice(0, 10);
}

function resolveWeekDate(arg) {
  const today = localDateStr();
  if (!arg) {
    // 默认上一个完整周：本周周一再往前 7 天
    return addDays(weekStart(today), -7);
  }
  if (arg === "current") return today;
  if (/^\d{4}-W\d{2}$/.test(arg)) return isoWeekMonday(arg);
  if (/^\d{4}-\d{2}-\d{2}$/.test(arg)) return arg;
  throw new Error(`--week 参数无效：${arg}（支持 current / YYYY-Www / YYYY-MM-DD）`);
}

function fmtWan(wan) {
  if (!wan || wan <= 0) return "未披露";
  if (wan >= 10000) return `${(wan / 10000).toFixed(1).replace(/\.0$/, "")} 亿`;
  return `${wan} 万`;
}

function sign(n) {
  return n > 0 ? `+${n}` : String(n);
}

function itemRow(it) {
  const title = (it.title || "").replace(/\|/g, "\\|");
  const link = it.sourceUrl ? `[来源](${it.sourceUrl})` : "—";
  return `| ${title} | ${it.city || "—"} | ${fmtWan(it.moneyWan)} | ${it.bidDeadline || "未写明"} | ${it.firstSeenAt} | ${link} |`;
}

export function renderMarkdown(f) {
  const o = f.overview;
  const L = [];
  L.push(`# 招标趋势周报 · ${f.week}（${f.range.from} ~ ${f.range.to}）`);
  L.push("");
  L.push(`> 数据底座：\`scripts/weekly-bid-report.mjs\` 生成（同目录 ${f.week}.facts.json）；`);
  L.push("> 「本周解读」由模型基于事实层撰写。行业分布为精匹配条目口径，宽口径计数仅用于数据健康。");
  L.push("");
  L.push("## 本周解读");
  L.push("");
  L.push("> 🤖 待模型撰写：基于下列事实层写 3-5 句判断（趋势 / 机会 / 风险），");
  L.push("> 不得编造事实层没有的数字；行业洞察仅精匹配口径。");
  L.push("");
  L.push("## 一、本周概览");
  L.push("");
  L.push(
    `- 新增 ${o.curr.newCount} 条 · 在途 ${o.curr.activeCount} 条 · 出窗 ${o.curr.expiredCount} 条 · 5★ ${o.curr.fiveStarCount} 条 · 披露金额合计 ${fmtWan(o.curr.totalMoneyWan)}`,
  );
  if (o.delta && o.prev) {
    L.push(
      `- 环比上周：新增 ${sign(o.delta.newCount)} · 在途 ${sign(o.delta.activeCount)} · 出窗 ${sign(o.delta.expiredCount)} · 5★ ${sign(o.delta.fiveStarCount)} · 金额 ${sign(o.delta.totalMoneyWan)} 万`,
    );
  } else {
    L.push(`- 环比：无（数据积累中，已积累 ${f.historyDays} 天，满 5 天后开启环比）`);
  }
  L.push(`- 历史库跟踪总量 ${f.tracked} 条 · 数据截至 ${f.dataAsOf || "—"}`);
  L.push("");

  L.push("## 二、值得盯的项目");
  L.push("");
  const sections = [
    [`5★ 项目（${f.watch.fiveStar.length}）`, f.watch.fiveStar],
    [`临近截止（10 天内，${f.watch.deadlineSoon.length}）`, f.watch.deadlineSoon],
    [`大额（${f.watch.bigMoney.length}）`, f.watch.bigMoney],
  ];
  for (const [title, list] of sections) {
    L.push(`### ${title}`);
    L.push("");
    if (!list.length) {
      L.push("（无）");
    } else {
      L.push("| 项目 | 城市 | 金额 | 投标截止 | 首见 | 链接 |");
      L.push("| --- | --- | --- | --- | --- | --- |");
      for (const it of list.slice(0, 15)) L.push(itemRow(it));
      if (list.length > 15) {
        L.push(`（仅列前 15 条，完整 ${list.length} 条见 ${f.week}.facts.json）`);
      }
    }
    L.push("");
  }

  L.push("## 三、异动候选（环比上周）");
  L.push("");
  const moverTable = (rows, label) => {
    if (!rows.length) {
      L.push(`（${label}无显著异动）`);
      L.push("");
      return;
    }
    L.push(`| ${label} | 上周 | 本周 | Δ |`);
    L.push("| --- | --- | --- | --- |");
    for (const r of rows) L.push(`| ${r.name} | ${r.prev} | ${r.curr} | ${sign(r.delta)} |`);
    L.push("");
  };
  L.push("### 行业 · 升温");
  L.push("");
  moverTable(f.movers.professions.up, "行业");
  L.push("### 行业 · 降温");
  L.push("");
  moverTable(f.movers.professions.down, "行业");
  L.push("### 地域 · 升温");
  L.push("");
  moverTable(f.movers.cities.up, "地域");
  L.push("### 地域 · 降温");
  L.push("");
  moverTable(f.movers.cities.down, "地域");

  L.push("## 四、数据健康");
  L.push("");
  if (!f.health.length) {
    L.push("- 本周无同步记录");
  } else {
    const okCount = f.health.filter((h) => h.ok).length;
    L.push(`- 同步 ${f.health.length} 天：成功 ${okCount} / 失败 ${f.health.length - okCount}`);
    for (const h of f.health) {
      L.push(
        `  - ${h.date} ${h.ok ? "✓" : "✗"} 宽口径 raw ${h.rawCount} / 软件池 ${h.softwareCount} / 精匹配 ${h.matchedCount} / 5★ ${h.fiveStarCount}${h.error ? ` · ${h.error}` : ""}`,
      );
    }
  }
  L.push("");
  L.push("---");
  L.push("");
  L.push(
    "口径：new=首见在本周 · active=本周内见到 · expired=末见在本周且已离最近成功快照；行业按「条目×行业出现次数」计，合计≠条目总数。",
  );
  L.push("");
  return L.join("\n");
}

export function runWeekly({ weekArg, quiet = false } = {}) {
  const weekDate = resolveWeekDate(weekArg);
  const { rows } = readHistoryRows();
  const facts = weeklyFacts(rows, { weekDate });
  const md = renderMarkdown(facts);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const factsPath = path.join(OUT_DIR, `${facts.week}.facts.json`);
  const mdPath = path.join(OUT_DIR, `${facts.week}.md`);
  fs.writeFileSync(factsPath, JSON.stringify(facts, null, 2) + "\n");
  fs.writeFileSync(mdPath, md);

  if (!quiet) {
    console.log(
      `周报底座 ${facts.week}（${facts.range.from} ~ ${facts.range.to}）：` +
        `新增 ${facts.overview.curr.newCount} / 在途 ${facts.overview.curr.activeCount} / ` +
        `5★ ${facts.overview.curr.fiveStarCount} · 环比${facts.comparable ? "已算" : "无（积累中）"}`,
    );
    console.log(
      `产物 → ${path.relative(root, factsPath)} + ${path.relative(root, mdPath)}`,
    );
    console.log("下一步：模型读 facts.json 撰写「本周解读」段落。");
  }
  return { facts, md, factsPath, mdPath };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const weekArgRaw = process.argv.find((a) => a.startsWith("--week="));
  runWeekly({ weekArg: weekArgRaw ? weekArgRaw.slice(7) : undefined });
}
