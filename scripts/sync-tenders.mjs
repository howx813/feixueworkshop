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
 *   BXND_EXTRA_KEYWORDS=中电信人工智能,中电信人工智能科技有限公司
 *     # 额外检索词（逗号分隔），并入 SEARCH_KEYWORDS，用于重点采购人/主题
 *
 * 说明: 账号密码勿写入仓库；页面/产物勿出现敏感机构称谓。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
  appendActivity,
  appendHistory,
  loadKnownIds,
} from "./lib/tender-history.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// —— M1 · 失败记账：同步中断也写 meta(syncOk:false) + activity，不吞退出码 ——
let failureRecorded = false;
function recordFailure(err) {
  if (failureRecorded) return;
  failureRecorded = true;
  const message = err instanceof Error ? err.message : String(err);
  try {
    appendHistory(root, {
      items: [],
      meta: {
        rawCount: 0,
        softwareCount: 0,
        matchedCount: 0,
        fiveStarCount: 0,
        syncOk: false,
        error: message.slice(0, 200),
      },
    });
    appendActivity(root, {
      ok: false,
      newCount: 0,
      activeCount: 0,
      artifacts: [],
      note: message.slice(0, 200),
    });
  } catch (e) {
    console.error("[tenders-history] 失败记账自身出错：", e);
  }
}
process.on("uncaughtException", (err) => {
  recordFailure(err);
  console.error(err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  recordFailure(err);
  console.error(err);
  process.exit(1);
});

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

/**
 * keys = 硬门槛词（用于星级/重合判断）
 * softKeys = 业态相关词（仅作列表提示，不单独抬升到 5 星）
 */
const QUALS = [
  { id: "cmmi3", name: "CMMI（3级）", domain: "研发", keys: ["CMMI", "软件能力成熟度"], softKeys: ["软件开发", "应用软件"] },
  { id: "cmmi5", name: "CMMI5", domain: "研发", keys: ["CMMI5", "CMMI 5", "CMMI五级"] },
  { id: "cs2", name: "CS / 信息系统建设服务", domain: "集成", keys: ["信息系统建设和服务", "CS2", "CS贰级", "CS 贰级"], softKeys: ["系统集成", "信息化"] },
  { id: "iso20000", name: "ISO20000", domain: "运维", keys: ["ISO20000", "ISO 20000", "ISO/IEC 20000"], softKeys: ["信息技术服务管理", "IT服务"] },
  { id: "iso27001", name: "ISO27001", domain: "安全", keys: ["ISO27001", "ISO 27001", "ISO/IEC 27001"], softKeys: ["信息安全", "等保"] },
  { id: "itss3", name: "ITSS", domain: "运维", keys: ["ITSS"], softKeys: ["运行维护", "运维服务", "ITO", "信息运维"] },
  { id: "sysint", name: "系统集成资质/等级", domain: "集成", keys: ["系统集成甲级", "系统集成乙级", "系统集成企业"], softKeys: ["系统集成", "运营商系统集成"] },
  { id: "dcmm2", name: "DCMM", domain: "数据", keys: ["DCMM"], softKeys: ["数据管理", "数据治理"] },
  { id: "dsmm2", name: "DSMM", domain: "数据", keys: ["DSMM"], softKeys: ["数据安全"] },
  { id: "ccrc", name: "CCRC 信息安全服务", domain: "安全", keys: ["CCRC", "信息安全服务资质"], softKeys: ["安全集成", "风险评估"] },
  { id: "secret", name: "涉密相关", domain: "安全", keys: ["涉密信息系统", "涉密资质"], softKeys: ["涉密", "保密"] },
  { id: "software-ent", name: "软件企业/软件产品", domain: "研发", keys: ["软件企业", "软件产品证书"], softKeys: ["软著", "软件产品"] },
  { id: "vas", name: "增值电信业务许可", domain: "通用", keys: ["增值电信业务经营许可证", "增值电信"], softKeys: ["云服务", "云计算"] },
  { id: "ei-1", name: "电子与智能化", domain: "集成", keys: ["电子与智能化工程", "电子与智能化"], softKeys: ["智能化", "弱电", "安防监控"] },
  { id: "iso9001", name: "质量管理体系", domain: "通用", keys: ["ISO9001", "ISO 9001", "质量管理体系认证"], softKeys: ["质量管理体系"] },
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

/** 环境变量追加的重点检索词（采购人/主题），去重后并入搜索列表 */
const EXTRA_KEYWORDS = (process.env.BXND_EXTRA_KEYWORDS || "")
  .split(/[,，]/)
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * 全国检索词（不按贵州省过滤）。中电信人工智能科技主体在北京，标讯常不挂 520000。
 * 可用 BXND_FOCUS_KEYWORDS 覆盖；默认覆盖「中电信人工智能」系。
 */
const FOCUS_KEYWORDS = (
  process.env.BXND_FOCUS_KEYWORDS ||
  "中电信人工智能科技有限公司,中电信人工智能科技,中电信人工智能科技（北京）有限公司,中电信人工智能"
)
  .split(/[,，]/)
  .map((s) => s.trim())
  .filter(Boolean);
const FOCUS_MAX_PAGES = Number(process.env.BXND_FOCUS_MAX_PAGES || 8);

/** 重点采购人/主体（正文命中时抬升星级；并打 focusTags 供页面筛选） */
const FOCUS_BUYER_RE =
  /中电信人工智能科技|中电信人工智能|电信人工智能科技|中电信数智科技|中电信数智|中国电信贵州/;

/** 专项：中电信人工智能科技有限公司（含北京主体） */
const FOCUS_CTA_AI_RE =
  /中电信人工智能科技|中电信人工智能科技有限公司|中电信人工智能科技（北京）/;

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

/** soft=true 时合并 softKeys，仅用于列表提示 */
function matchQuals(text, { soft = false } = {}) {
  const hit = [];
  for (const q of QUALS) {
    const keys = soft
      ? [...(q.keys || []), ...(q.softKeys || [])]
      : q.keys || [];
    if (keys.some((k) => k && text.includes(k))) {
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

/**
 * 综合分级 1–5 星（内部对照软件能力清单 + 可投性因素）。
 * 站点展示用「匹配星级」，不出现机构称谓。
 */
function rateStars(ctx) {
  const {
    title,
    professions,
    matchedQuals,
    tenderType,
    money,
    keys,
    detailText,
  } = ctx;
  const reasons = [];
  let pts = 0;

  const isZhao = ["招采", "招标"].includes(tenderType);
  const isClosed = /中标|候选|成交|流标|废标|终止|异常/.test(title + tenderType);
  if (isZhao && !isClosed) {
    pts += 22;
    reasons.push("在投/采购公告阶段");
  } else if (isClosed) {
    pts -= 25;
    reasons.push("已结束或结果公示，参考价值低");
  }

  const softTitle = /软件开发|应用软件|信息系统|系统集成|信息化平台/.test(title);
  if (softTitle) {
    pts += 20;
    reasons.push("标题强软件/信息化信号");
  } else if (SOFTWARE_RE.test(title)) {
    pts += 12;
    reasons.push("标题含信息化相关词");
  }
  if ((professions || []).some((p) => /软件|系统集成|信息运维|信息化/.test(p))) {
    pts += 10;
    reasons.push("专业标签匹配");
  }

  // 硬门槛只看原文，避免用「已匹配名称」二次命中（如 CMMI 名称再触发 CMMI5）
  const hardQuals = matchQuals(
    `${keys.qualSection || ""} ${(keys.qualHits || []).join(" ")} ${detailText || ""} ${title}`,
    { soft: false },
  );
  const nHard = hardQuals.length;
  const nSoft = (matchedQuals || []).length;
  if (nHard >= 3) {
    pts += 30;
    reasons.push(`硬门槛标准命中 ${nHard} 项（高度重合）`);
  } else if (nHard >= 2) {
    pts += 22;
    reasons.push(`硬门槛标准命中 ${nHard} 项`);
  } else if (nHard === 1) {
    pts += 12;
    reasons.push(`硬门槛标准命中：${hardQuals[0].name}`);
  } else if (nSoft >= 2) {
    pts += 8;
    reasons.push("业态相关，但未见明确证书门槛词");
  }

  // 规模：软件类常见可投区间加权
  if (money >= 50 && money <= 2000) {
    pts += 12;
    reasons.push(`规模适中（约 ${money.toFixed(0)} 万）`);
  } else if (money > 2000 && money <= 8000) {
    pts += 8;
    reasons.push("规模偏大，需评估交付能力");
  } else if (money > 0 && money < 50) {
    pts += 4;
    reasons.push("规模较小");
  }

  if (keys.bidDeadline) {
    pts += 8;
    reasons.push(`投标截止：${keys.bidDeadline}`);
  }
  if (keys.docFeeRequired === false) {
    pts += 3;
    reasons.push("不收取文件费");
  } else if (keys.docFeeRequired === true) {
    pts += 1;
    reasons.push(keys.docFeeText || "需购文件");
  }

  // 重点采购人（电信 AI 等）抬升排序；展示文案不写机构全称
  const focusBlob = `${title} ${detailText || ""} ${keys.qualSection || ""} ${(keys.qualHits || []).join(" ")}`;
  if (FOCUS_BUYER_RE.test(focusBlob)) {
    pts += 25;
    reasons.push("重点采购主体相关");
  }

  // 扣分：明显非软件主业
  if (/绿化|绿植|课桌|药品|校服|土建主体|道路施工/.test(title)) {
    pts -= 30;
    reasons.push("疑似非目标业态");
  }

  pts = Math.max(0, Math.min(100, Math.round(pts)));

  let stars = 1;
  const hasGateInfo = !!(keys.qualSection || (keys.qualHits && keys.qualHits.length));
  const scaleOk = money >= 30 && money <= 5000;
  const actionable = isZhao && !isClosed && softTitle;

  // 5 星 = 高度可跟进：在投软件主业 + 高分 +（证书级硬命中 或 资格信息+规模/截止齐）
  if (
    actionable &&
    pts >= 68 &&
    (nHard >= 1 || (hasGateInfo && scaleOk && keys.bidDeadline))
  ) {
    stars = 5;
  } else if (actionable && pts >= 58) {
    stars = 4;
  } else if (pts >= 48) {
    stars = 3;
  } else if (pts >= 34) {
    stars = 2;
  } else {
    stars = 1;
  }

  // 硬命中加注
  if (nHard >= 1) {
    reasons.push(
      `证书级重合：${hardQuals
        .map((q) => q.name)
        .slice(0, 4)
        .join("、")}`,
    );
  }

  return {
    stars,
    starScore: pts,
    starReasons: reasons.slice(0, 8),
    hardQuals,
  };
}

function parseAttachments(detail) {
  if (!detail) return [];
  const out = [];
  if (Array.isArray(detail.attachments) && detail.attachments.length) {
    for (const a of detail.attachments) {
      let fileUrl = a.fileUrl || a.url || a.path || "";
      let fileName = a.fileName || a.name || "file";
      // 有的条目 fileName 里塞了整段 URL
      if (!fileUrl && /^https?:\/\//i.test(fileName)) {
        fileUrl = fileName;
        fileName = "附件";
      }
      if (!fileUrl && typeof a === "string" && a.includes("http")) {
        const m = a.match(/(https?:\/\/\S+)/);
        if (m) fileUrl = m[1];
      }
      if (fileUrl && /^https?:\/\//i.test(fileUrl)) {
        out.push({ fileName, fileUrl });
      }
    }
  }
  // "name.pdf？https://..." 或 "name.pdf?https://..."
  const raw = detail.attachment || "";
  if (typeof raw === "string" && raw.includes("http")) {
    for (const part of raw.split(",")) {
      const m = part.match(/([^？?,]+\.(?:pdf|docx?|zip|rar))?[\s？?]*?(https?:\/\/[^\s,]+)/i);
      if (!m) continue;
      out.push({
        fileName: (m[1] || "附件").trim(),
        fileUrl: m[2].trim(),
      });
    }
  }
  // 去重
  const seen = new Set();
  return out.filter((a) => {
    if (seen.has(a.fileUrl)) return false;
    seen.add(a.fileUrl);
    return true;
  });
}

async function downloadFile(url, dest) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "zh-CN,zh;q=0.9",
      // 贵州公资附件 OSS 对缺 Referer 的请求常 403
      Referer: "http://www.ccgp-guizhou.gov.cn/",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error(`download too small (${buf.length})`);
  fs.writeFileSync(dest, buf);
  return buf.length;
}

function extractPdfText(pdfPath) {
  try {
    const out = execFileSync("pdftotext", ["-layout", pdfPath, "-"], {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      timeout: 60000,
    });
    return out || "";
  } catch {
    return "";
  }
}

/** 对 5 星项目：下附件 + 正文/PDF 深挖 */
async function deepAnalyzeFiveStar(item, detail, keys) {
  const docsRoot = path.join(root, "data/tender-docs", item.id);
  fs.mkdirSync(docsRoot, { recursive: true });

  const atts = parseAttachments(detail);
  const saved = [];
  let pdfText = "";

  // 优先下「招标文件」类
  const ordered = [...atts].sort((a, b) => {
    const rank = (n) =>
      /招标文件|采购文件|询比文件|磋商文件|谈判文件/.test(n) ? 0 : 1;
    return rank(a.fileName) - rank(b.fileName);
  });

  for (const att of ordered.slice(0, 4)) {
    try {
      const safe = att.fileName.replace(/[^\w.\u4e00-\u9fff()-]+/g, "_");
      const dest = path.join(docsRoot, safe || "file.bin");
      const size = await downloadFile(att.fileUrl, dest);
      saved.push({ fileName: att.fileName, size, local: dest });
      if (/\.pdf$/i.test(att.fileName) && !pdfText) {
        pdfText = extractPdfText(dest).slice(0, 80000);
      }
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      saved.push({
        fileName: att.fileName,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // 无 PDF 时用公告正文深挖
  const detailPlain = stripHtml(
    (detail && (detail.contentText || detail.content)) || "",
  );
  const corpus = `${item.title}\n${keys.qualSection || ""}\n${detailPlain}\n${pdfText}`.replace(
    /\s+/g,
    " ",
  );
  const matchedStandards = matchQuals(corpus, { soft: false }).map((q) => q.name);

  const mustRequirements = [];
  const reqPatterns = [
    /须具备[^。；;]{6,80}/g,
    /应具备[^。；;]{6,80}/g,
    /必须具有[^。；;]{6,80}/g,
    /资格要求[：:]\s*[^。；;]{6,100}/g,
    /特定资格要求[：:]\s*[^。；;]{6,120}/g,
  ];
  for (const re of reqPatterns) {
    const ms = corpus.match(re) || [];
    for (const m of ms) {
      const t = m.trim();
      if (t.length >= 8 && !mustRequirements.includes(t)) {
        mustRequirements.push(t.slice(0, 120));
      }
      if (mustRequirements.length >= 10) break;
    }
  }

  // 简单 gap：正文出现的标准词未命中清单
  const mentioned = [];
  for (const re of [
    /CMMI\s*\d?/gi,
    /ISO\s*27001/gi,
    /ISO\s*20000/gi,
    /ITSS/gi,
    /CS[1-5一二三四五级]+/g,
    /涉密/g,
    /系统集成[甲乙]级/g,
  ]) {
    const ms = corpus.match(re) || [];
    for (const m of ms) {
      if (!mentioned.includes(m)) mentioned.push(m);
    }
  }
  const gaps = mentioned.filter(
    (m) => !matchedStandards.some((s) => s.toLowerCase().includes(m.toLowerCase().slice(0, 4))),
  );

  const summaryParts = [
    `匹配星级 ${item.stars}（综合分 ${item.starScore}）`,
    item.bidDeadline ? `截止 ${item.bidDeadline}` : "截止未从公告解析到",
    item.scaleText || (item.moneyWan ? `规模约 ${item.moneyWan} 万` : "规模未披露"),
    matchedStandards.length
      ? `与能力清单重合：${matchedStandards.slice(0, 5).join("、")}`
      : "与能力清单重合点较少，需人工看资格专章",
    saved.filter((s) => s.local).length
      ? `已下载附件 ${saved.filter((s) => s.local).length} 个`
      : "未获取到可下载招标文件附件（可能仅有来源链接）",
  ];

  const analysis = {
    analyzedAt: new Date().toISOString(),
    id: item.id,
    title: item.title,
    stars: item.stars,
    starScore: item.starScore,
    starReasons: item.starReasons,
    bidDeadline: item.bidDeadline || keys.bidDeadline || "",
    scaleText: item.scaleText || "",
    docFeeText: item.docFeeText || "",
    matchedStandards,
    mustRequirements: mustRequirements.slice(0, 10),
    mentionedInDoc: mentioned.slice(0, 15),
    gaps: gaps.slice(0, 8),
    files: saved.map(({ fileName, size, error }) => ({
      fileName,
      size: size || 0,
      error: error || null,
    })),
    sourceUrl: item.sourceUrl,
    summary: summaryParts.join("；") + "。",
    // 本地路径不写进公开 JSON
  };

  fs.writeFileSync(
    path.join(docsRoot, "analysis.json"),
    JSON.stringify({ ...analysis, localDir: docsRoot }, null, 2) + "\n",
  );
  fs.writeFileSync(
    path.join(docsRoot, "analysis.md"),
    [
      `# ${item.title}`,
      "",
      `- 星级：${"★".repeat(item.stars)}${"☆".repeat(5 - item.stars)}（${item.starScore}）`,
      `- 截止：${analysis.bidDeadline || "未解析"}`,
      `- 规模：${analysis.scaleText || "未披露"}`,
      `- 文件费：${analysis.docFeeText || "未写明"}`,
      `- 来源：${item.sourceUrl || ""}`,
      "",
      "## 分级理由",
      ...(item.starReasons || []).map((r) => `- ${r}`),
      "",
      "## 与能力清单重合",
      ...(matchedStandards.length
        ? matchedStandards.map((x) => `- ${x}`)
        : ["- （较少，见资格专章）"]),
      "",
      "## 文件中的资格表述（摘录）",
      ...(mustRequirements.length
        ? mustRequirements.map((x) => `- ${x}`)
        : ["- （未自动抽出，请打开 PDF）"]),
      "",
      "## 附件",
      ...saved.map((f) =>
        f.local
          ? `- ${f.fileName}（${f.size} bytes）`
          : `- ${f.fileName} 失败：${f.error}`,
      ),
      "",
      analysis.summary,
      "",
    ].join("\n"),
  );

  // 返回可上公开展示的摘要（无本地路径、无机构称谓）
  return {
    analyzedAt: analysis.analyzedAt,
    summary: analysis.summary,
    matchedStandards: analysis.matchedStandards,
    mustRequirements: analysis.mustRequirements,
    mentionedInDoc: analysis.mentionedInDoc,
    gaps: analysis.gaps,
    files: analysis.files,
    hasLocalDocs: saved.some((s) => s.local),
  };
}

/**
 * @param {string} keyword
 * @param {{ provinceCodes?: number[] | null, maxPages?: number }} [opts]
 * provinceCodes=null/[] → 全国检索（不传省码，避免把北京主体过滤掉）
 */
async function fetchKeyword(keyword, opts = {}) {
  const maxPages = opts.maxPages ?? MAX_PAGES;
  const provinceCodes =
    opts.provinceCodes === undefined ? PROVINCE_CODES : opts.provinceCodes;
  const collected = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const body = {
      pageIndex: page,
      pageSize: PAGE_SIZE,
      keyword,
    };
    if (Array.isArray(provinceCodes) && provinceCodes.length > 0) {
      body.provinceCodes = provinceCodes;
    }
    const json = await apiPost("/api/admin/ProjectLibrary/ListByPage", body);
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

function focusTagsFor(title, buyer, blob = "") {
  const text = `${title} ${buyer} ${blob}`;
  const tags = [];
  if (FOCUS_CTA_AI_RE.test(text)) tags.push("cta-ai");
  if (/中电信数智|中国电信贵州|中国电信股份有限公司贵州/.test(text)) {
    tags.push("telecom-gz");
  }
  return tags;
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
const ALL_KEYWORDS = [
  ...SEARCH_KEYWORDS,
  ...EXTRA_KEYWORDS.filter((k) => !SEARCH_KEYWORDS.includes(k)),
];
console.log(
  `同步标讯: province=${PROVINCE_CODES.join(",")} days=${DAYS} since>=${since} pages<=${MAX_PAGES} keywords=${ALL_KEYWORDS.length}`,
);
if (EXTRA_KEYWORDS.length) {
  console.log(`  重点词: ${EXTRA_KEYWORDS.join(" · ")}`);
}
const authed = await ensureToken();

const byId = new Map();
for (const kw of ALL_KEYWORDS) {
  process.stdout.write(`  · [黔] ${kw} ... `);
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

// 全国：中电信人工智能科技（北京主体标讯常不挂贵州省码）
console.log(
  `全国重点检索: ${FOCUS_KEYWORDS.join(" · ")} pages<=${FOCUS_MAX_PAGES}`,
);
for (const kw of FOCUS_KEYWORDS) {
  process.stdout.write(`  · [全国] ${kw} ... `);
  const items = await fetchKeyword(kw, {
    provinceCodes: null,
    maxPages: FOCUS_MAX_PAGES,
  });
  let added = 0;
  for (const it of items) {
    if (!byId.has(it.id)) {
      byId.set(it.id, { ...it, _focusNational: true });
      added += 1;
    } else {
      byId.get(it.id)._focusNational = true;
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
  const buyer = stripHtml(it.zhaoBiao || it.customerName || "");
  // 重点采购人相关公告优先入池（含全国检索命中）
  if (FOCUS_BUYER_RE.test(`${title} ${buyer}`) || it._focusNational) {
    if (EXCLUDE_RE.test(title)) return false;
    // 工服/装饰等弱相关仍排除
    if (/工服|装饰施工|绿化|绿植/.test(title) && !SOFTWARE_RE.test(title)) {
      return false;
    }
    return true;
  }
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
  // 列表提示用 soft；星级另算 hard
  const matchedQuals = matchQuals(
    `${fullBlob} ${keys.qualSection} ${keys.qualHits.join(" ")}`,
    { soft: true },
  );
  for (const hit of keys.qualHits) {
    const extra = matchQuals(hit, { soft: true });
    for (const q of extra) {
      if (!matchedQuals.some((x) => x.id === q.id)) matchedQuals.push(q);
    }
  }

  const tenderType = it.tenderType || "";
  const money = keys.moneyWan || Number(it.zhaoBiaoMoney || 0) || 0;
  const buyerName = stripHtml(
    it.zhaoBiao || it.customerName || detail?.zhaoBiao || "",
  );
  let score = scoreItem(title, professions, matchedQuals, tenderType, money);
  if (keys.bidDeadline) score += 8;
  if (keys.docFeeRequired !== null) score += 4;
  if (keys.qualHits.length || keys.qualSection) score += 6;
  if (money > 0) score += 4;

  const isFocusHit =
    FOCUS_BUYER_RE.test(`${title} ${buyerName}`) || it._focusNational;
  // 重点采购人入池放宽；通用池仍要求最低分
  if (!isFocusHit && matchedQuals.length === 0 && score < 35) continue;

  const sourceUrl =
    detail?.sourceUrl ||
    it.sourceUrl ||
    `https://dgdata.bxnd.com.cn/project-lib/detail2/${it.id}`;

  const rating = rateStars({
    title,
    professions,
    matchedQuals,
    tenderType,
    money,
    keys,
    detailText,
  });

  const tags = focusTagsFor(title, buyerName, fullBlob);

  tenders.push({
    id: String(it.id),
    title,
    tenderType,
    date: it.date || (it.publishDate || "").slice(0, 10) || "",
    publishTime: it.publishTime || it.createdOn || "",
    province: it.province || (it._focusNational ? "" : "贵州省"),
    city: it.city || "",
    buyer: buyerName,
    moneyWan: money || 0,
    professions,
    matchedQuals,
    score,
    stars: rating.stars,
    starScore: rating.starScore,
    starReasons: rating.starReasons,
    focusTags: tags,
    sourceUrl,
    platformUrl: `https://dgdata.bxnd.com.cn/project-lib/detail2/${it.id}`,
    stageName: it.stageName || "",
    purchaseTypeName: it.purchaseTypeName || "",
    bidDeadline: keys.bidDeadline,
    fileGetDeadline: keys.fileGetDeadline,
    scaleText: keys.scaleText,
    docFeeRequired: keys.docFeeRequired,
    docFeeText: keys.docFeeText,
    bondText: keys.bondText,
    qualSection: keys.qualSection,
    qualHits: keys.qualHits,
    _detail: detail,
    _keys: keys,
  });
}
console.log(`详情拉取 ${detailFetched} 条`);

tenders.sort((a, b) => {
  if ((b.stars || 0) !== (a.stars || 0)) return (b.stars || 0) - (a.stars || 0);
  if ((b.starScore || 0) !== (a.starScore || 0)) {
    return (b.starScore || 0) - (a.starScore || 0);
  }
  if (b.score !== a.score) return b.score - a.score;
  return (b.date || "").localeCompare(a.date || "");
});

// 深挖池：5 星优先；不足时用高分 4 星且有附件的补齐
const deepLimit = Number(process.env.BXND_DEEP_LIMIT || 5);
const attRank = (t) => {
  const d = t._detail || {};
  if (parseAttachments(d).length) return 2;
  if (d.isAtt) return 1;
  return 0;
};
const deepPool = [
  ...tenders.filter((t) => t.stars === 5),
  ...tenders.filter((t) => t.stars === 4 && attRank(t) > 0),
]
  .sort(
    (a, b) =>
      (b.stars || 0) - (a.stars || 0) ||
      attRank(b) - attRank(a) ||
      (b.starScore || 0) - (a.starScore || 0),
  )
  .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

console.log(
  `深挖池 ${deepPool.length}（5★ ${tenders.filter((t) => t.stars === 5).length}），上限 ${deepLimit}`,
);
let deepDone = 0;
for (const t of deepPool) {
  if (deepDone >= deepLimit) break;
  try {
    process.stdout.write(`  深挖 ${t.stars}★ ${t.id} ... `);
    t.deepAnalysis = await deepAnalyzeFiveStar(t, t._detail, t._keys);
    // PDF/正文若挖到硬门槛，可升为 5 星
    const hardFromDeep = (t.deepAnalysis.matchedStandards || []).length;
    if (t.stars < 5 && hardFromDeep >= 1 && ["招采", "招标"].includes(t.tenderType)) {
      t.stars = 5;
      t.starReasons = [
        ...(t.starReasons || []),
        `附件/正文硬门槛：${t.deepAnalysis.matchedStandards.slice(0, 3).join("、")}`,
      ].slice(0, 8);
      console.log("ok → 升为5★");
    } else {
      console.log("ok");
    }
    deepDone += 1;
  } catch (e) {
    console.log("fail", e instanceof Error ? e.message : e);
    t.deepAnalysis = {
      summary: `深挖失败：${e instanceof Error ? e.message : String(e)}`,
      hasLocalDocs: false,
      files: [],
      matchedStandards: [],
      mustRequirements: [],
    };
  }
}
// 深挖后按星级重排；中电信人工智能专项优先入窗（避免被贵州通用池挤掉）
tenders.sort((a, b) => {
  const aFocus = (a.focusTags || []).includes("cta-ai") ? 1 : 0;
  const bFocus = (b.focusTags || []).includes("cta-ai") ? 1 : 0;
  if (bFocus !== aFocus) return bFocus - aFocus;
  if ((b.stars || 0) !== (a.stars || 0)) return (b.stars || 0) - (a.stars || 0);
  if ((b.starScore || 0) !== (a.starScore || 0)) {
    return (b.starScore || 0) - (a.starScore || 0);
  }
  return (b.date || "").localeCompare(a.date || "");
});

const TOP_LIMIT = Number(process.env.BXND_TOP_LIMIT || 100);
const top = tenders.slice(0, TOP_LIMIT).map((t) => {
  const { _detail, _keys, ...pub } = t;
  return pub;
});
const ctaAiCount = top.filter((t) => (t.focusTags || []).includes("cta-ai")).length;
console.log(`专项入窗：中电信人工智能 ${ctaAiCount} 条（上限 ${TOP_LIMIT}）`);

const starDist = [1, 2, 3, 4, 5].map(
  (s) => `${s}★:${top.filter((t) => t.stars === s).length}`,
);
console.log(`星级分布 ${starDist.join(" ")}；深挖完成 ${deepDone}`);

const out = {
  syncedAt: new Date().toISOString(),
  source: "public tender list + detail",
  authenticated: authed,
  provinceCodes: PROVINCE_CODES,
  since,
  queryCount: ALL_KEYWORDS.length + FOCUS_KEYWORDS.length,
  rawCount: raw.length,
  softwareCount: cut.length,
  matchedCount: top.length,
  fiveStarCount: top.filter((t) => t.stars === 5).length,
  ctaAiCount: top.filter((t) => (t.focusTags || []).includes("cta-ai")).length,
  telecomGzCount: top.filter((t) =>
    (t.focusTags || []).includes("telecom-gz"),
  ).length,
  deepAnalyzed: deepDone,
  note:
    "匹配星级综合「软件相关度 / 公开标准关键词 / 在投状态 / 规模 / 截止信息」。含全国检索「中电信人工智能科技」专项。5 星会尝试下载公开附件并做资格摘录。不等于可中标判断。账号密码勿入库。",
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

// —— M1 · 步骤 4/5：事件留痕 + activity 记账（失败不阻断快照主流程）——
try {
  const knownIds = loadKnownIds(root);
  const newCount = top.filter((t) => !knownIds.has(String(t.id))).length;
  const hist = appendHistory(root, {
    items: top,
    meta: {
      rawCount: raw.length,
      softwareCount: cut.length,
      matchedCount: top.length,
      fiveStarCount: out.fiveStarCount,
      syncOk: true,
    },
  });
  appendActivity(root, {
    ok: true,
    newCount,
    activeCount: top.length,
    artifacts: [path.relative(root, hist.file), "public/data/tenders.json"],
    note: "",
  });
  console.log(
    `历史留痕 +${hist.itemLines} 行（今日新增 ${newCount} 条）→ ${path.relative(root, hist.file)}`,
  );
} catch (e) {
  console.error(
    "[tenders-history] 留痕失败（不影响快照输出）：",
    e instanceof Error ? e.message : e,
  );
}

console.log(
  "方案 C：静态站读 /data/tenders.json；定时跑本脚本后 commit/部署即可更新线上。",
);
