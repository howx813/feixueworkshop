/**
 * 同步「每日标讯」：拉取公开软件/信息化类招标列表，按行业标准关键词做提示匹配，
 * 写入 src/data/tenders.generated.json 与 public/data/tenders.json。
 *
 * 用法:
 *   npm run tenders:sync
 *
 * 可选环境变量（.env.local，勿提交）:
 *   BXND_API_BASE=...
 *   BXND_USERNAME=...
 *   BXND_PASSWORD=...
 *   BXND_TOKEN=...
 *   BXND_PROVINCE_CODES=520000
 *   BXND_DAYS=14
 *   BXND_MAX_PAGES=3
 *   BXND_PAGE_SIZE=30
 *
 * 说明: 账号密码勿写入仓库；页面/产物勿出现敏感机构称谓。
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

/** 与 src/data/software-quals.ts 对齐（脚本侧自包含） */
const QUALS = [
  { id: "cmmi3", name: "CMMI（3级）", domain: "研发", keys: ["CMMI", "软件能力成熟度", "软件开发", "应用软件"] },
  { id: "cmmi5", name: "CMMI5", domain: "研发", keys: ["CMMI", "CMMI5", "软件开发"] },
  { id: "cs2", name: "CS / 信息系统建设服务", domain: "集成", keys: ["CS", "信息系统建设和服务", "系统集成", "信息化"] },
  { id: "iso20000", name: "ISO20000", domain: "运维", keys: ["ISO20000", "ISO 20000", "信息技术服务管理", "IT服务", "运维"] },
  { id: "iso27001", name: "ISO27001", domain: "安全", keys: ["ISO27001", "ISO 27001", "信息安全", "等保", "网络安全"] },
  { id: "itss3", name: "ITSS", domain: "运维", keys: ["ITSS", "运行维护", "运维服务", "ITO", "信息运维"] },
  { id: "sysint", name: "系统集成相关", domain: "集成", keys: ["系统集成", "运营商系统集成"] },
  { id: "dcmm2", name: "DCMM", domain: "数据", keys: ["DCMM", "数据管理", "大数据", "数据治理"] },
  { id: "dsmm2", name: "DSMM", domain: "数据", keys: ["DSMM", "数据安全"] },
  { id: "ccrc", name: "CCRC 信息安全服务", domain: "安全", keys: ["CCRC", "信息安全服务", "安全集成", "风险评估"] },
  { id: "secret", name: "涉密相关", domain: "安全", keys: ["涉密", "保密"] },
  { id: "software-ent", name: "软件企业/软件产品", domain: "研发", keys: ["软件企业", "软件产品", "软著"] },
  { id: "vas", name: "增值电信业务许可", domain: "通用", keys: ["增值电信", "云服务", "云计算"] },
  { id: "ei-1", name: "电子与智能化", domain: "集成", keys: ["电子与智能化", "智能化", "弱电", "安防监控", "智慧安防"] },
  { id: "iso9001", name: "质量管理体系", domain: "通用", keys: ["ISO9001", "质量管理体系"] },
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
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\$\{[^}]*\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function daysAgoIso(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** 中文时间串 → 可读字符串（只保留日期时间，去掉后文杂质） */
function normalizeCnDateTime(raw) {
  if (!raw) return "";
  let s = String(raw).replace(/\s+/g, " ").trim();
  // 优先抠「2026年07月31日 09时30分00秒」整段
  const cn = s.match(
    /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日(?:\s*(\d{1,2})\s*时\s*(\d{1,2})\s*分(?:\s*(\d{1,2})\s*秒)?)?/,
  );
  if (cn) {
    const pad = (n) => String(n).padStart(2, "0");
    const date = `${cn[1]}-${pad(cn[2])}-${pad(cn[3])}`;
    if (cn[4] != null) {
      return `${date} ${pad(cn[4])}:${pad(cn[5])}${cn[6] != null ? `:${pad(cn[6])}` : ""}`;
    }
    return date;
  }
  s = s
    .replace(/年/g, "-")
    .replace(/月/g, "-")
    .replace(/日/g, " ")
    .replace(/时/g, ":")
    .replace(/分/g, ":")
    .replace(/秒/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const iso = s.match(
    /(\d{4}-\d{1,2}-\d{1,2})(?:\s+(\d{1,2}:\d{1,2}(?::\d{1,2})?))?/,
  );
  if (iso) {
    const pad = (n) => String(n).padStart(2, "0");
    const [y, m, d] = iso[1].split("-");
    const date = `${y}-${pad(m)}-${pad(d)}`;
    if (iso[2]) {
      const parts = iso[2].split(":").map((x) => pad(x));
      return `${date} ${parts.join(":")}`;
    }
    return date;
  }
  return s.slice(0, 19);
}

/**
 * 从正文/结构化字段抽取：截止时间、标书费、规模、资质要求。
 * 平台结构化日期常为空，主要靠公告正文正则。
 */
function extractKeyFields(plain, listItem = {}, detail = {}) {
  const text = plain || "";

  // —— 投标/响应截止 ——
  let bidDeadline = "";
  const dateChunk =
    "([0-9]{4}\\s*年\\s*[0-9]{1,2}\\s*月\\s*[0-9]{1,2}\\s*日(?:\\s*[0-9]{1,2}\\s*时\\s*[0-9]{1,2}\\s*分(?:\\s*[0-9]{1,2}\\s*秒)?)?)";
  const ddlPatterns = [
    new RegExp(`投标文件递交截止时间[^0-9]{0,24}${dateChunk}`),
    new RegExp(`响应文件递交截止时间[^0-9]{0,24}${dateChunk}`),
    new RegExp(`(?:投标|响应)截止时间[^0-9]{0,16}${dateChunk}`),
    new RegExp(`递交截止时间[^0-9]{0,16}${dateChunk}`),
    new RegExp(`开标时间[^0-9]{0,12}${dateChunk}`),
    // 纯数字日期：2026-08-07 09:30
    /(?:投标|响应|递交)截止时间[^0-9]{0,12}(\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}[日]?(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/,
  ];
  for (const re of ddlPatterns) {
    const m = text.match(re);
    if (m) {
      bidDeadline = normalizeCnDateTime(m[1]);
      break;
    }
  }
  if (!bidDeadline) {
    bidDeadline =
      listItem.endDate ||
      detail.endDate ||
      listItem.endEsDate ||
      detail.endEsDate ||
      listItem.applyEndDate ||
      detail.applyEndDate ||
      "";
  }

  // —— 获取招标/采购文件截止 ——
  let fileGetDeadline = "";
  const fileDdl = text.match(
    /(?:获取|购买|下载)(?:招标|采购|询比|招标采购)?文件[^。；;\n]{0,20}截止[^：:0-9]{0,12}[：:]\s*([0-9]{4}\s*年\s*[0-9]{1,2}\s*月\s*[0-9]{1,2}\s*日[^。；;\n]{0,30})/,
  );
  if (fileDdl) fileGetDeadline = normalizeCnDateTime(fileDdl[1]);
  if (!fileGetDeadline) {
    fileGetDeadline =
      listItem.getFileEndDate || detail.getFileEndDate || "";
  }

  // —— 标书/文件费用 ——
  let docFeeRequired = null; // true | false | null
  let docFeeText = "";
  if (
    /不收取\s*(?:招标|询比|采购)?文件(?:费用|费)|获取本(?:招标|询比|采购)?文件不收取|文件费用[：:]\s*本项目不收取|每套售价\s*0\s*元/.test(
      text,
    )
  ) {
    docFeeRequired = false;
    docFeeText = "不收取文件费用";
  } else {
    const feeM = text.match(
      /(?:招标|询比|采购)?文件(?:费用|费|售价)[^。；;\n]{0,40}?([0-9]+(?:\.[0-9]+)?)\s*元/,
    );
    const saleM = text.match(/每套售价\s*([0-9]+(?:\.[0-9]+)?)\s*元/);
    const amt = feeM?.[1] || saleM?.[1];
    if (amt && Number(amt) > 0) {
      docFeeRequired = true;
      docFeeText = `需购买，约 ${amt} 元/套`;
    } else if (/收取\s*(?:招标|询比|采购)?文件(?:费用|费)|文件售价|购买(?:招标|采购)文件/.test(text)) {
      docFeeRequired = true;
      docFeeText = "需购买文件（金额见原文）";
    }
  }

  // —— 规模 / 金额 ——
  // 列表 zhaoBiaoMoney 多为「万元」；详情多为「元」
  let moneyWan = Number(listItem.zhaoBiaoMoney || 0) || 0;
  const detailMoney = Number(detail.zhaoBiaoMoney || 0) || 0;
  if (detailMoney > 0) {
    if (detailMoney >= 1000) {
      // 元
      const asWan = detailMoney / 10000;
      if (!moneyWan || Math.abs(moneyWan - asWan) / asWan > 0.05) {
        moneyWan = asWan;
      }
    } else if (!moneyWan) {
      moneyWan = detailMoney;
    }
  }

  let scaleText = "";
  const capM = text.match(
    /最高(?:响应|投标)?(?:总价)?限价\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)\s*元/,
  );
  const budgetM = text.match(
    /(?:采购预算|预算金额|项目预算|合同估算价|招标控制价)\s*[：:为]?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)\s*万元?/,
  );
  if (capM) {
    const yuan = Number(capM[1].replace(/,/g, ""));
    scaleText = `最高限价 ${(yuan / 10000).toFixed(2)} 万元`;
    if (!moneyWan) moneyWan = yuan / 10000;
  } else if (budgetM) {
    const n = Number(budgetM[1].replace(/,/g, ""));
    // 若原文带「万元」关键词
    if (/万元/.test(budgetM[0]) || n < 10000) {
      scaleText = `预算约 ${n} 万元`;
      if (!moneyWan) moneyWan = n;
    } else {
      scaleText = `预算约 ${(n / 10000).toFixed(2)} 万元`;
      if (!moneyWan) moneyWan = n / 10000;
    }
  } else if (moneyWan > 0) {
    scaleText =
      moneyWan >= 10000
        ? `约 ${(moneyWan / 10000).toFixed(2)} 亿元`
        : `约 ${moneyWan.toFixed(moneyWan >= 100 ? 0 : 2)} 万元`;
  }

  const bond =
    Number(listItem.bondMoney || detail.bondMoney || 0) || 0;
  let bondText = "";
  if (bond > 0) {
    bondText =
      bond >= 1000
        ? `保证金约 ${(bond / 10000).toFixed(2)} 万元`
        : `保证金约 ${bond} 万元`;
  }

  // —— 资质要求（正文段落 + 关键词条） ——
  let qualSection = "";
  const sectionRes = [
    /(?:供应商|投标人|申请人)(?:的)?资格要求(.{0,1200}?)(?=\d+\.\s*(?:获取|招标|采购|询比|响应|投标)文件|获取(?:招标|询比)文件|三[、.．]|3[、.．]\s*获取|$)/,
    /资格要求[：:\s]*(.{0,800}?)(?=\d+\.\s*获取|获取文件|投标文件|$)/,
    /资质要求[：:\s]*(.{0,800}?)(?=\d+\.\s*获取|获取文件|$)/,
  ];
  for (const re of sectionRes) {
    const m = text.match(re);
    if (m && m[1] && m[1].length > 20) {
      qualSection = m[1].replace(/\s+/g, " ").trim().slice(0, 600);
      break;
    }
  }

  const qualHits = [];
  const hitRes = [
    /CMMI\s*[0-9一二三四五级]*/gi,
    /信息系统建设和服务能力[^，,。；;\s]{0,12}/g,
    /CS[一二三四五1-5级]+/g,
    /ISO\s*\/?\s*IEC\s*27001|ISO\s*27001/gi,
    /ISO\s*\/?\s*IEC\s*20000|ISO\s*20000/gi,
    /ITSS[^，,。；;\s]{0,10}/g,
    /DCMM[^，,。；;\s]{0,10}/g,
    /DSMM[^，,。；;\s]{0,10}/g,
    /CCRC[^，,。；;\s]{0,20}/g,
    /软件企业[^，,。；;\s]{0,10}/g,
    /系统集成(?:企业|资质|证书|甲级|乙级|一级|二级)/g,
    /电子与智能化[^，,。；;\s]{0,12}/g,
    /涉密[^，,。；;\s]{0,20}/g,
    /注册资本[^。；;]{0,30}/g,
    /近\s*[一二三3]\s*年[^。；;]{0,40}业绩/g,
  ];
  for (const re of hitRes) {
    const all = text.match(re);
    if (all) {
      for (const x of all) {
        const t = x.trim();
        if (t && !qualHits.includes(t)) qualHits.push(t);
      }
    }
  }

  return {
    bidDeadline: bidDeadline || "",
    fileGetDeadline: fileGetDeadline || "",
    docFeeRequired,
    docFeeText: docFeeText || (docFeeRequired === null ? "原文未写明" : ""),
    moneyWan: Number(moneyWan.toFixed(4)) || 0,
    scaleText: scaleText || (moneyWan > 0 ? "" : "规模未披露"),
    bondText,
    qualSection,
    qualHits: qualHits.slice(0, 12),
  };
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
  console.log("已登录标讯源（凭证未写入产物）");
  return true;
}

function matchQuals(text) {
  const hit = [];
  for (const q of QUALS) {
    if (q.keys.some((k) => text.includes(k))) {
      hit.push({ id: q.id, name: q.name, domain: q.domain });
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
let detailFetched = 0;
// 招采优先拉详情（关键字段在正文）；中标/候选也拉前 N 条
const preferZhao = cut.filter((it) =>
  ["招采", "招标"].includes(it.tenderType || ""),
);
const rest = cut.filter((it) => !["招采", "招标"].includes(it.tenderType || ""));
const ordered = [...preferZhao, ...rest];

for (const it of ordered) {
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

  // 为截取截止/资质/标书费，对入围池尽量拉详情（上限 100）
  let detail = null;
  if (detailFetched < 100) {
    detail = await maybeDetail(it.id);
    detailFetched += 1;
    await new Promise((r) => setTimeout(r, 100));
  }

  const detailText = detail
    ? stripHtml(detail.contentText || detail.content || "")
    : "";
  const fullBlob = `${blob} ${detailText}`.slice(0, 12000);
  const keys = extractKeyFields(detailText || blob, it, detail || {});
  const matchedQuals = matchQuals(`${fullBlob} ${keys.qualSection} ${keys.qualHits.join(" ")}`);
  // 正文明确写的资质关键词，补进 matchedQuals 展示
  for (const hit of keys.qualHits) {
    const extra = matchQuals(hit);
    for (const q of extra) {
      if (!matchedQuals.some((x) => x.id === q.id)) matchedQuals.push(q);
    }
  }

  const tenderType = it.tenderType || "";
  const money = keys.moneyWan || Number(it.zhaoBiaoMoney || 0) || 0;
  let score = scoreItem(title, professions, matchedQuals, tenderType, money);
  // 关键字段完整度加分
  if (keys.bidDeadline) score += 8;
  if (keys.docFeeRequired !== null) score += 4;
  if (keys.qualHits.length || keys.qualSection) score += 6;
  if (money > 0) score += 4;

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
    // 关键四字段
    bidDeadline: keys.bidDeadline,
    fileGetDeadline: keys.fileGetDeadline,
    scaleText: keys.scaleText,
    docFeeRequired: keys.docFeeRequired,
    docFeeText: keys.docFeeText,
    bondText: keys.bondText,
    qualSection: keys.qualSection,
    qualHits: keys.qualHits,
  });
}
console.log(`详情拉取 ${detailFetched} 条`);

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
    "软件类项目 + 行业公开标准关键词提示；不等于招标文件明文要求，不代表任何主体持证。账号密码勿入库。",
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
