/**
 * 站点访问分析同步：51la OpenAPI → public/data/site-analytics.json
 *
 * 数据源：https://v6.51.la/user/application/openapi
 *   - /trend/day          按天趋势（uv/pv/ip/sv/新访客）
 *   - /visitor/detail/list 访问明细（按会话，含 region 地区）
 *
 * 密钥：.env.local 的 LA51_ACCESS_KEY / LA51_SECRET_KEY（勿提交，勿写进前端）
 * 配额：免费额度 100 次/月。每次运行消耗 = 1（趋势）+ 天数 × 页数（明细）。
 *       默认拉最近 7 个完整自然日 ≈ 8 次/周 ≈ 35 次/月，请控制运行频率。
 *
 * 可选环境变量：
 *   LA51_MASK_ID      站点掩码 ID（不填则调 /site/list 自动匹配，多耗 1 次）
 *   ANALYTICS_DAYS    统计天数，默认 7
 *   ANALYTICS_MAX_PAGES 明细每天最多翻页数（每页 100 会话），默认 3
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

const DAYS = Math.max(1, Number(process.env.ANALYTICS_DAYS || 7));
const MAX_PAGES = Math.max(1, Number(process.env.ANALYTICS_MAX_PAGES || 3));
const SITE_DOMAIN =
  process.env.LA51_SITE_DOMAIN || "tcloudbaseapp.com";

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
  if (!res.ok || !json) {
    throw new Error(`${apiPath} HTTP ${res.status}`);
  }
  if (!json.success) {
    throw new Error(`${apiPath} 失败：${json.code} ${json.message}`);
  }
  return json;
}

/* ---------------- 日期工具 ---------------- */

function fmt(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 最近 N 个完整自然日（昨天往前），升序 */
function recentDays(n) {
  const days = [];
  const today = new Date();
  for (let i = n; i >= 1; i--) {
    days.push(fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)));
  }
  return days;
}

/* ---------------- 主流程 ---------------- */

async function resolveMaskId() {
  if (process.env.LA51_MASK_ID) return process.env.LA51_MASK_ID;
  const json = await callApi("/site/list");
  const sites = json.data || [];
  const hit = sites.find((s) => String(s.domain || "").includes(SITE_DOMAIN));
  if (!hit) throw new Error(`/site/list 未找到域名含 ${SITE_DOMAIN} 的站点`);
  console.log(`  站点：${hit.siteName}（maskId ${hit.maskId}）`);
  return hit.maskId;
}

async function main() {
  const maskId = await resolveMaskId();
  const days = recentDays(DAYS);
  const from = days[0];
  const to = days[days.length - 1];
  console.log(`同步 ${from} ~ ${to}（${DAYS} 天）`);

  // 1) 按天趋势（1 次调用）
  const trendJson = await callApi("/trend/day", {
    maskId,
    startDay: from,
    endDay: to,
  });
  const trend = (trendJson.data || [])
    .map((d) => ({
      time: d.time,
      uv: d.uv ?? 0,
      pv: d.pv ?? 0,
      ip: d.ip ?? 0,
      sv: d.sv ?? 0,
      newUserCount: d.newUserCount ?? 0,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  // 2) 访问明细（每天 1+ 次调用）→ 地区聚合
  const regionMap = new Map(); // region -> {sessions, pv, newVisitors}
  let totalSessions = 0;
  for (const day of days) {
    let page = 1;
    for (;;) {
      const json = await callApi("/visitor/detail/list", {
        maskId,
        day,
        page,
        size: 100,
      });
      const items = json.data || [];
      for (const it of items) {
        const region = String(it.region || "未知").trim() || "未知";
        const cur = regionMap.get(region) || { sessions: 0, pv: 0, newVisitors: 0 };
        cur.sessions += 1;
        cur.pv += Number(it.pv || 0);
        if (String(it.visitorType || "").includes("新")) cur.newVisitors += 1;
        regionMap.set(region, cur);
        totalSessions += 1;
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
  }

  const regions = [...regionMap.entries()]
    .map(([region, v]) => ({ region, ...v }))
    .sort((a, b) => b.sessions - a.sessions);

  const totals = trend.reduce(
    (acc, d) => ({
      uv: acc.uv + d.uv,
      pv: acc.pv + d.pv,
      ip: acc.ip + d.ip,
      sv: acc.sv + d.sv,
      newUserCount: acc.newUserCount + d.newUserCount,
    }),
    { uv: 0, pv: 0, ip: 0, sv: 0, newUserCount: 0 },
  );

  const out = {
    schemaVersion: 1,
    source: "51la OpenAPI",
    generatedAt: new Date().toISOString(),
    range: { from, to },
    totals,
    trend,
    regions,
    detailSessions: totalSessions,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`✔ 写出 ${path.relative(root, OUT)}`);
  console.log(
    `  合计 UV ${totals.uv} / PV ${totals.pv}；地区 ${regions.length} 个（会话 ${totalSessions}）；本次 API 调用 ${apiCalls} 次`,
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
