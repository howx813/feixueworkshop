/**
 * 标讯历史库（M1 · 纯事件溯源）
 *
 * 设计依据：docs/p0-tenders-radar-design.md v1.2 §3.1 / §3.3
 *
 * - data/tenders-history/YYYY-MM.jsonl：按月分片，只追加，永不重写
 *   - 明细行 kind:"item"：精匹配条目，14 天快照窗口内每日重复留痕
 *   - meta 行 kind:"meta"：每日宽口径计数（raw/software/matched/fiveStar）+ syncOk
 * - data/agent-activity.jsonl：每次同步（无论成败）记一行
 *
 * 派生字段（firstSeenAt / lastSeenAt / seenCount / newCount）一律聚合期计算，
 * 本模块只负责可靠追加；不进库的字段：deepAnalysis 全文、附件清单。
 */
import fs from "node:fs";
import path from "node:path";

/** 本地时区 YYYY-MM-DD（抓取与展示都按本地日口径） */
export function localDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function historyDir(root) {
  return path.join(root, "data", "tenders-history");
}

export function historyFileFor(root, syncDate) {
  return path.join(historyDir(root), `${syncDate.slice(0, 7)}.jsonl`);
}

export function activityFile(root) {
  return path.join(root, "data", "agent-activity.jsonl");
}

/** 快照条目 → 明细行（只保留聚合与展示需要的公开字段） */
export function toItemLine(t, syncDate) {
  return {
    kind: "item",
    id: t.id != null ? String(t.id) : "",
    syncDate,
    title: t.title || "",
    tenderType: t.tenderType || "",
    date: t.date || "",
    province: t.province || "",
    city: t.city || "",
    buyer: t.buyer || "",
    moneyWan: Number(t.moneyWan) || 0,
    professions: Array.isArray(t.professions) ? t.professions : [],
    stars: t.stars || 0,
    score: t.score || 0,
    stageName: t.stageName || "",
    bidDeadline: t.bidDeadline || "",
    sourceUrl: t.sourceUrl || "",
  };
}

export function appendLines(file, lines) {
  if (!lines.length) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
}

/**
 * 追加一天的事件：item 行若干 + 末尾一行 meta。
 * meta 需含 rawCount/softwareCount/matchedCount/fiveStarCount/syncOk，
 * syncOk:false 时可附 error 摘要。
 */
export function appendHistory(root, { items, meta, syncDate = localDate() }) {
  const file = historyFileFor(root, syncDate);
  const lines = [
    ...items.map((t) => toItemLine(t, syncDate)),
    { kind: "meta", syncDate, ...meta },
  ];
  appendLines(file, lines);
  return { file, itemLines: items.length };
}

/** 同步记账（成败均写）；entry: { ok, newCount, activeCount, artifacts, note } */
export function appendActivity(root, entry) {
  const file = activityFile(root);
  appendLines(file, [
    { ts: new Date().toISOString(), agent: "tenders-sync", ...entry },
  ]);
  return file;
}

/**
 * 扫描历史库收集已知 id（坏行容错、忽略 meta 行）。
 * 用于同步期计算 newCount；M2 聚合器复用同一读取逻辑。
 */
export function loadKnownIds(root) {
  const ids = new Set();
  const dir = historyDir(root);
  if (!fs.existsSync(dir)) return ids;
  for (const name of fs.readdirSync(dir)) {
    if (!/^\d{4}-\d{2}\.jsonl$/.test(name)) continue;
    const text = fs.readFileSync(path.join(dir, name), "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      try {
        const row = JSON.parse(t);
        if (row && row.kind === "item" && row.id != null) {
          ids.add(String(row.id));
        }
      } catch {
        // 坏行跳过，不阻断扫描
      }
    }
  }
  return ids;
}
