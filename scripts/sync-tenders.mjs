/**
 * 同步「每日标讯」：从市场态势感知平台公开列表接口拉取贵州软件类招标，
 * 按通服软件相关资质关键词匹配，写入 src/data/tenders.generated.json。
 *
 * 用法:
 *   npm run tenders:sync
 *
 * 可选环境变量（.env.local，勿提交）:
 *   BXND_API_BASE=https://dgdata-api.bxnd.com.cn
 *   BXND_USERNAME=...                   # 账号
 *   BXND_PASSWORD=...                   # 密码（优先自动登录拿 token）
 *   BXND_TOKEN=...                      # 可选；有则跳过登录
 *   BXND_PROVINCE_CODES=520000          # 默认贵州
 *   BXND_DAYS=14                        # 回溯天数
 *   BXND_MAX_PAGES=3                    # 每个关键词最多页数
 *   BXND_PAGE_SIZE=30
 *
 * 说明:
 * - 列表接口可不登录；有账号密码时会自动 Login 取 Bearer，便于详情等接口。
 * - 勿把账号密码写入仓库。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const API_BASE = (
  process.env.BXND_API_BASE || "https://dgdata-api.bxnd.com.cn"
).replace(/\/$/, "");
const PROVINCE_CODES = (process.env.BXND_PROVINCE_CODES || "520000")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter(Boolean);
const DAYS = Number(process.env.BXND_DAYS || 14);
const MAX_PAGES = Number(process.env.BXND_MAX_PAGES || 3);
const PAGE_SIZE = Number(process.env.BXND_PAGE_SIZE || 30);
const USERNAME = process.env.BXND_USERNAME || "";
const PASSWORD = process.env.BXND_PASSWORD || "";
let TOKEN = process.env.BXND_TOKEN || "";

/** 与 src/data/tongfu-software-quals.ts 保持同步（脚本侧自包含，避免 TS import） */
const QUALS = [
  { id: "cmmi3", name: "CMMI（3级）", entity: "省公司", keys: ["CMMI", "软件能力成熟度", "软件开发", "应用软件"] },
  { id: "cmmi5", name: "CMMI5", entity: "设计院", keys: ["CMMI", "CMMI5", "软件开发"] },
  { id: "cs2", name: "CS 贰级 / CS2", entity: "省公司/设计院", keys: ["CS", "信息系统建设和服务", "系统集成", "信息化"] },
  { id: "iso20000", name: "ISO20000", entity: "省公司", keys: ["ISO20000", "ISO 20000", "信息技术服务管理", "IT服务", "运维"] },
  { id: "iso27001", name: "ISO27001", entity: "省公司", keys: ["ISO27001", "ISO 27001", "信息安全", "等保", "网络安全"] },
  { id: "itss3", name: "ITSS 三级", entity: "省公司/设计院", keys: ["ITSS", "运行维护", "运维服务", "ITO", "信息运维"] },
  { id: "sysint-aaa", name: "系统集成领域 AAA", entity: "省公司", keys: ["系统集成", "运营商系统集成"] },
  { id: "dcmm2", name: "DCMM 2级", entity: "省公司", keys: ["DCMM", "数据管理", "大数据", "数据治理"] },
  { id: "dsmm2", name: "DSMM 2级", entity: "省公司", keys: ["DSMM", "数据安全"] },
  { id: "ccrc", name: "CCRC 信息安全服务", entity: "省公司", keys: ["CCRC", "信息安全服务", "安全集成", "风险评估"] },
  { id: "secret", name: "涉密集成/软件开发", entity: "省公司/设计院", keys: ["涉密", "保密"] },
  { id: "software-ent", name: "软件企业/软件产品", entity: "设计院", keys: ["软件企业", "软件产品", "软著"] },
  { id: "vas", name: "增值电信业务经营许可证", entity: "省公司", keys: ["增值电信", "云服务", "云计算"] },
  { id: "ei-1", name: "电子与智能化壹级", entity: "省公司", keys: ["电子与智能化", "智能化", "弱电", "安防监控", "智慧安防"] },
  { id: "iso9001", name: "质量管理体系", entity: "省公司", keys: ["ISO9001", "质量管理体系"] },
];

const SEARCH_KEYWORDS = [
  "软件开发",
  "应用软件",
  "信息系统",
  "系统集成",
  "信息化",
  "数字化",
  "智慧",
  "大数据",
  "人工智能",
  "运维服务",
  "信息安全",
  "云服务",
];

const SOFTWARE_RE =
  /软件开发|应用软件|软件系统|信息系统|系统集成|信息化|数字化|智慧|大数据|人工智能|\bAI\b|数据平台|业务系统|管理平台|运维服务|信息运维|ITO|云服务|云计算|等保|网络安全|信息安全|数据治理|平台建设|平台开发|软件/;
const EXCLUDE_RE =
  /绿植|绿化|吊顶|课桌|校服|教材|图书采购|药品|疫苗|化肥|农药|单体液压支柱|焦化|煤炭洗选|管式炉|水质在线监测设备运维/;

function stripHtml(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function daysAgoIso(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function apiPost(pathname, body) {
  const headers = {
    "Content-Type": "application/json",
    Origin: "https://dgdata.bxnd.com.cn",
    Referer: "https://dgdata.bxnd.com.cn/",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  const res = await fetch(`${API_BASE}${pathname}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${pathname} HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** 用账号密码换 Bearer；失败时退回匿名列表。 */
async function ensureToken() {
  if (TOKEN) {
    console.log("使用已有 BXND_TOKEN");
    return true;
  }
  if (!USERNAME || !PASSWORD) {
    console.log("未配置 BXND_USERNAME/PASSWORD，匿名拉取列表");
    return false;
  }
  const json = await apiPost("/api/AdminLogin/Login", {
    username: USERNAME.trim(),
    password: PASSWORD,
  });
  if (!json?.success || !json?.data?.token) {
    console.warn("登录失败:", json?.message || "unknown", "→ 继续匿名拉取");
    return false;
  }
  TOKEN = json.data.token;
  console.log(
    `已登录: ${json.data.userName || USERNAME}（${json.data.companyName || "—"}）`,
  );
  return true;
}

function matchQuals(text) {
  const hit = [];
  for (const q of QUALS) {
    if (q.keys.some((k) => text.includes(k))) {
      hit.push({ id: q.id, name: q.name, entity: q.entity });
    }
  }
  return hit;
}

function isSoftwareProject(title, professions) {
  const blob = `${title} ${(professions || []).join(" ")}`;
  if (EXCLUDE_RE.test(blob)) return false;
  return SOFTWARE_RE.test(blob);
}

function scoreItem(title, professions, quals, tenderType, money) {
  let score = 0;
  if (SOFTWARE_RE.test(title)) score += 30;
  if ((professions || []).some((p) => SOFTWARE_RE.test(p))) score += 20;
  score += Math.min(quals.length * 12, 36);
  if (tenderType === "招采" || tenderType === "招标") score += 15;
  if (money && money > 0) score += Math.min(Math.log10(money + 1) * 5, 15);
  return Math.round(score);
}

async function fetchKeyword(keyword) {
  const collected = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const json = await apiPost("/api/admin/ProjectLibrary/ListByPage", {
      pageIndex: page,
      pageSize: PAGE_SIZE,
      keyword,
      provinceCodes: PROVINCE_CODES,
    });
    if (!json?.success) {
      console.warn(`  ! ${keyword} p${page}:`, json?.message || "failed");
      break;
    }
    const items = json.data?.items || [];
    collected.push(...items);
    if (items.length < PAGE_SIZE) break;
  }
  return collected;
}

async function maybeDetail(id) {
  try {
    const json = await apiPost("/api/admin/ProjectLibrary/Detail", { id });
    if (json?.success && json.data) return json.data;
  } catch {
    /* optional */
  }
  return null;
}

const since = daysAgoIso(DAYS);
console.log(
  `同步标讯: province=${PROVINCE_CODES.join(",")} days=${DAYS} since>=${since} pages<=${MAX_PAGES}`,
);
const authed = await ensureToken();

const byId = new Map();
for (const kw of SEARCH_KEYWORDS) {
  process.stdout.write(`  · ${kw} ... `);
  const items = await fetchKeyword(kw);
  let added = 0;
  for (const it of items) {
    if (!byId.has(it.id)) {
      byId.set(it.id, it);
      added += 1;
    }
  }
  console.log(`${items.length} 条, +${added}`);
  await new Promise((r) => setTimeout(r, 200));
}

const raw = [...byId.values()];
const cut = raw.filter((it) => {
  const date = it.date || (it.publishDate || "").slice(0, 10) || "";
  if (date && date < since) return false;
  const title = stripHtml(it.name);
  const professions = it.professionNames || [];
  return isSoftwareProject(title, professions);
});

console.log(`去重 ${raw.length} → 软件类 ${cut.length}（${since} 起）`);

const tenders = [];
for (const it of cut) {
  const title = stripHtml(it.name);
  const professions = it.professionNames || [];
  const blob = [
    title,
    professions.join(" "),
    stripHtml(it.keyContent || ""),
    stripHtml(it.projectDesc || ""),
    it.purchaseTypeName || "",
    it.classTypeName || "",
  ].join(" ");

  let detail = null;
  // 仅对分数潜力高的条目拉详情，控制请求量
  if (
    /软件开发|系统集成|信息化|信息系统|信息安全|CMMI|ITSS/.test(blob) ||
    (it.zhaoBiaoMoney && it.zhaoBiaoMoney >= 50)
  ) {
    detail = await maybeDetail(it.id);
    await new Promise((r) => setTimeout(r, 120));
  }

  const detailText = detail
    ? stripHtml(detail.contentText || detail.content || "")
    : "";
  const fullBlob = `${blob} ${detailText}`.slice(0, 8000);
  const matchedQuals = matchQuals(fullBlob);
  const tenderType = it.tenderType || "";
  const money = Number(it.zhaoBiaoMoney || 0);
  const score = scoreItem(title, professions, matchedQuals, tenderType, money);

  // 至少要有软件信号；有资质命中的排前面
  if (matchedQuals.length === 0 && score < 35) continue;

  const sourceUrl =
    detail?.sourceUrl ||
    it.sourceUrl ||
    `https://dgdata.bxnd.com.cn/project-lib/detail2/${it.id}`;

  tenders.push({
    id: String(it.id),
    title,
    tenderType,
    date: it.date || (it.publishDate || "").slice(0, 10) || "",
    publishTime: it.publishTime || it.createdOn || "",
    province: it.province || "贵州省",
    city: it.city || "",
    buyer: stripHtml(it.zhaoBiao || it.customerName || detail?.zhaoBiao || ""),
    moneyWan: money || 0,
    professions,
    matchedQuals,
    score,
    sourceUrl,
    platformUrl: `https://dgdata.bxnd.com.cn/project-lib/detail2/${it.id}`,
    stageName: it.stageName || "",
    purchaseTypeName: it.purchaseTypeName || "",
  });
}

tenders.sort((a, b) => {
  if (b.score !== a.score) return b.score - a.score;
  return (b.date || "").localeCompare(a.date || "");
});

const top = tenders.slice(0, 80);
const out = {
  syncedAt: new Date().toISOString(),
  source: "dgdata-api.bxnd.com.cn / ProjectLibrary.ListByPage",
  authenticated: authed,
  provinceCodes: PROVINCE_CODES,
  since,
  queryCount: SEARCH_KEYWORDS.length,
  rawCount: raw.length,
  softwareCount: cut.length,
  matchedCount: top.length,
  note:
    "软件类项目 + 通服软件相关资质关键词提示；标签=通服侧相关能力，不等于招标文件明文要求。账号密码勿入库。",
  items: top,
};

const jsonText = JSON.stringify(out, null, 2) + "\n";
const outPath = path.join(root, "src/data/tenders.generated.json");
const publicDir = path.join(root, "public/data");
const publicPath = path.join(publicDir, "tenders.json");
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(outPath, jsonText);
fs.writeFileSync(publicPath, jsonText);
console.log(
  `已写入 ${top.length} 条 → ${path.relative(root, outPath)} + ${path.relative(root, publicPath)}（最高分 ${top[0]?.score ?? 0}）`,
);
console.log(
  "方案 C：静态站读 /data/tenders.json；定时跑本脚本后 commit/部署即可更新线上。",
);
