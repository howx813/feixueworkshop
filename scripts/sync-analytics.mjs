/**
 * 站点访问分析同步（增量版）：51la OpenAPI → public/data/site-analytics.json
 *
 * 数据源：https://v6.51.la/user/application/openapi
 *   - /visitor/detail/list 访问明细（按会话，含 region 地区 / ip / uuid）
 *   趋势与总量不再单独调接口：直接从明细按天聚合（uuid 去重≈UV、ip 去重≈IP），
 *   省掉 /trend/day 的调用。
 *
 * 增量设计（省配额的关键）：
 *   JSON 里保存按天明细聚合（daily），每次运行只拉「coveredTo 之后的新日子」。
 *   重复运行 0 消耗；漏跑自动补。稳态 ≈ 1 次调用/天，每周跑 ≈ 7 次/周。
 *   免费配额 100 次/月，请避免手动高频运行。
 *
 * 密钥：.env.local 的 LA51_ACCESS_KEY / LA51_SECRET_KEY（勿提交，勿写进前端）
 * 可选环境变量：
 *   LA51_MASK_ID         站点掩码 ID（不填则调 /site/list 自动匹配，多耗 1 次）
 *   ANALYTICS_MAX_PAGES  明细每天最多翻页数（每页 100 会话），默认 3
 *   ANALYTICS_MAX_DAYS   单次最多补拉天数，默认 31
 *   ANALYTICS_WINDOW     展示窗口天数，默认 7
 *
 * 用法：npm run analytics:sync
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const OUT = path.join(root, "public/data/site-analytics.json");

/* ---------------- 环境 ---------------- */

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

const AK = process.env.LA51_ACCESS_KEY || "";
const SK = process.env.LA51_SECRET_KEY || "";
if (!AK || !SK) {
  console.error("缺少 LA51_ACCESS_KEY / LA51_SECRET_KEY（写在 .env.local，勿提交）");
  process.exit(1);
}

const MAX_PAGES = Math.max(1, Number(process.env.ANALYTICS_MAX_PAGES || 3));
const MAX_DAYS = Math.max(1, Number(process.env.ANALYTICS_MAX_DAYS || 31));
const WINDOW = Math.max(1, Number(process.env.ANALYTICS_WINDOW || 7));
const SITE_DOMAIN = process.env.LA51_SITE_DOMAIN || "tcloudbaseapp.com";

/* ---------------- 51la API（type=2 中等加密签名） ---------------- */

let apiCalls = 0;

function makeSign(nonce, timestamp) {
  const params = { accessKey: AK, nonce, timestamp, secretKey: SK };
  const qs = Object.keys(params)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");
  return crypto.createHash("sha256").update(qs).digest("hex").toUpperCase();
}

async function callApi(apiPath, params = {}) {
  const nonce = Math.random().toString(36).slice(-4);
  const timestamp = Date.now();
  const res = await fetch(`https://v6-open.51.la/open${apiPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...params,
      accessKey: AK,
      nonce,
      timestamp,
      sign: makeSign(nonce, timestamp),
    }),
    signal: AbortSignal.timeout(20000),
  });
  apiCalls += 1;
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) throw new Error(`${apiPath} HTTP ${res.status}`);
  if (!json.success) throw new Error(`${apiPath} 失败：${json.code} ${json.message}`);
  return json;
}

/* ---------------- 日期工具 ---------------- */

function fmt(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function shiftDay(dateStr, delta) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return fmt(new Date(y, m - 1, d + delta));
}

function yesterday() {
  return shiftDay(fmt(new Date()), -1);
}

/* ---------------- 主流程 ---------------- */

async function resolveMaskId() {
  if (process.env.LA51_MASK_ID) return process.env.LA51_MASK_ID;
  const json = await callApi("/site/list");
  const hit = (json.data || []).find((s) =>
    String(s.domain || "").includes(SITE_DOMAIN),
  );
  if (!hit) throw new Error(`/site/list 未找到域名含 ${SITE_DOMAIN} 的站点`);
  console.log(`  站点：${hit.siteName}（maskId ${hit.maskId}）`);
  return hit.maskId;
}

/** 拉一天的访问明细 → 按天聚合（uv/ip 去重，地区分组） */
async function fetchDay(maskId, day) {
  const uuids = new Set();
  const ips = new Set();
  const regionMap = new Map();
  let sv = 0;
  let pv = 0;

  let page = 1;
  for (;;) {
    const json = await callApi("/visitor/detail/list", {
      maskId,
      day,
      page,
      size: 100,
    });
    for (const it of json.data || []) {
      sv += 1;
      pv += Number(it.pv || 0);
      if (it.uuid) uuids.add(String(it.uuid));
      if (it.ip) ips.add(String(it.ip));
      const region = String(it.region || "未知").trim() || "未知";
      const cur = regionMap.get(region) || { sessions: 0, pv: 0, newVisitors: 0 };
      cur.sessions += 1;
      cur.pv += Number(it.pv || 0);
      if (String(it.visitorType || "").includes("新")) cur.newVisitors += 1;
      regionMap.set(region, cur);
    }
    const pages = Number(json.pages || 0);
    if (page >= pages || page >= MAX_PAGES) {
      if (page >= MAX_PAGES && pages > MAX_PAGES) {
        console.log(`  ⚠ ${day} 共 ${pages} 页，仅取前 ${MAX_PAGES} 页（配额保护）`);
      }
      break;
    }
    page += 1;
  }

  return {
    date: day,
    uv: uuids.size,
    ip: ips.size,
    sv,
    pv,
    newUserCount: [...regionMap.values()].reduce((s, r) => s + r.newVisitors, 0),
    regions: [...regionMap.entries()]
      .map(([region, v]) => ({ region, ...v }))
      .sort((a, b) => b.sessions - a.sessions),
  };
}

async function main() {
  const maskId = await resolveMaskId();
  const to = yesterday();

  // 读已有数据（schema v2 才有 daily）
  /** @type {Map<string, object>} */
  const dailyMap = new Map();
  let coveredTo = null;
  if (fs.existsSync(OUT)) {
    try {
      const old = JSON.parse(fs.readFileSync(OUT, "utf8"));
      if (old.schemaVersion === 2 && Array.isArray(old.daily)) {
        for (const d of old.daily) dailyMap.set(d.date, d);
        coveredTo = old.coveredTo || null;
      }
    } catch {
      // 旧文件损坏则从头来
    }
  }

  // 本次要补的日子：coveredTo+1 … 昨天（无历史则补最近 WINDOW 天）
  let from = coveredTo ? shiftDay(coveredTo, 1) : shiftDay(to, -(WINDOW - 1));
  if (from < shiftDay(to, -(MAX_DAYS - 1))) from = shiftDay(to, -(MAX_DAYS - 1));

  if (from > to) {
    console.log(`数据已覆盖到 ${coveredTo}，无需补拉（0 次 API 调用）`);
  } else {
    console.log(`增量补拉 ${from} ~ ${to}`);
    for (let day = from; day <= to; day = shiftDay(day, 1)) {
      const agg = await fetchDay(maskId, day);
      dailyMap.set(day, agg);
      console.log(
        `  ${day}：会话 ${agg.sv} / UV≈${agg.uv} / 地区 ${agg.regions.length}`,
      );
    }
  }

  // 全量 daily（升序），展示窗口取最近 WINDOW 天
  const daily = [...dailyMap.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const winFrom = shiftDay(to, -(WINDOW - 1));
  const win = daily.filter((d) => d.date >= winFrom && d.date <= to);

  // 窗口聚合：趋势 / 总量 / 地区
  const trend = win.map((d) => ({
    time: d.date,
    uv: d.uv,
    pv: d.pv,
    ip: d.ip,
    sv: d.sv,
    newUserCount: d.newUserCount,
  }));
  const totals = win.reduce(
    (acc, d) => ({
      uv: acc.uv + d.uv,
      pv: acc.pv + d.pv,
      ip: acc.ip + d.ip,
      sv: acc.sv + d.sv,
      newUserCount: acc.newUserCount + d.newUserCount,
    }),
    { uv: 0, pv: 0, ip: 0, sv: 0, newUserCount: 0 },
  );
  const regionMap = new Map();
  for (const d of win) {
    for (const r of d.regions) {
      const cur = regionMap.get(r.region) || {
        sessions: 0,
        pv: 0,
        newVisitors: 0,
      };
      cur.sessions += r.sessions;
      cur.pv += r.pv;
      cur.newVisitors += r.newVisitors;
      regionMap.set(r.region, cur);
    }
  }
  const regions = [...regionMap.entries()]
    .map(([region, v]) => ({ region, ...v }))
    .sort((a, b) => b.sessions - a.sessions);

  const out = {
    schemaVersion: 2,
    source: "51la OpenAPI",
    generatedAt: new Date().toISOString(),
    range: { from: winFrom, to },
    coveredTo: to,
    totals,
    trend,
    regions,
    detailSessions: totals.sv,
    daily,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`✔ 写出 ${path.relative(root, OUT)}（窗口 ${winFrom} ~ ${to}）`);
  console.log(
    `  窗口合计 UV ${totals.uv} / PV ${totals.pv} / 会话 ${totals.sv}；地区 ${regions.length} 个；本次 API 调用 ${apiCalls} 次`,
  );
  if (regions.length > 0) {
    console.log(
      `  地区前三：${regions
        .slice(0, 3)
        .map((r) => `${r.region}(${r.sessions})`)
        .join("、")}`,
    );
  }
}

main().catch((e) => {
  console.error(`同步失败：${e.message || e}`);
  process.exit(1);
});
