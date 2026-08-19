/**
 * 同步微信公众号「已证实发布」的文章到静态站。
 *
 * 用法: npm run wechat:sync
 *
 * 环境变量（.env.local，勿提交）:
 *   WECHAT_MP_APPID / WECHAT_MP_APPSECRET / WECHAT_MP_NAME
 *   WECHAT_MP_MAX_ITEMS=30
 *   WECHAT_MP_ALLOW_DRAFT=1  # 仅调试；默认关闭，不上草稿
 *
 * 个人号常无 freepublish 权限。此时请把「发表记录」里的永久链接写入:
 *   data/wechat-mp-published-urls.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const URLS_FILE = path.join(root, "data/wechat-mp-published-urls.txt");

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

const APPID = process.env.WECHAT_MP_APPID || "";
const SECRET = process.env.WECHAT_MP_APPSECRET || "";
const MP_NAME = process.env.WECHAT_MP_NAME || "公众号";
const MAX_ITEMS = Number(process.env.WECHAT_MP_MAX_ITEMS || 30);
const ALLOW_DRAFT = process.env.WECHAT_MP_ALLOW_DRAFT === "1";

function decodeEntities(s = "") {
  return String(s)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”");
}

function stripHtml(html = "") {
  return decodeEntities(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function digestOf(item) {
  const d = (item.digest || "").trim();
  if (d && d !== "t") return d.slice(0, 160);
  return stripHtml(item.content || "").slice(0, 160);
}

function isPreviewUrl(url = "") {
  return /tempkey=|preview_id=|__biz=.*tempkey/i.test(url);
}

function isPermanentMpUrl(url = "") {
  if (!/^https?:\/\/mp\.weixin\.qq\.com\//i.test(url)) return false;
  if (isPreviewUrl(url)) return false;
  // /s/xxx 或 带 sn= 的经典永久链
  return /\/s\/[A-Za-z0-9_-]+/.test(url) || /[?&]sn=[a-f0-9]+/i.test(url);
}

async function getAccessToken() {
  if (!APPID || !SECRET) {
    throw new Error("缺少 WECHAT_MP_APPID / WECHAT_MP_APPSECRET（写在 .env.local）");
  }
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(APPID)}&secret=${encodeURIComponent(SECRET)}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.access_token) {
    const hint =
      json.errcode === 40164
        ? " → 请把本机访问微信的出口 IP 加入白名单（Clash 开着时多为代理出口 IP）"
        : "";
    throw new Error(
      `获取 access_token 失败: ${json.errcode || "?"} ${json.errmsg || ""}${hint}`,
    );
  }
  return json.access_token;
}

async function apiPost(token, pathname, body) {
  const res = await fetch(
    `https://api.weixin.qq.com${pathname}?access_token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return res.json();
}

function mapNewsRows(batch, idKey) {
  const items = [];
  for (const row of batch) {
    const articleId = row[idKey] || row.article_id || row.media_id || "";
    const news = row.content?.news_item || [];
    news.forEach((n, idx) => {
      const title = (n.title || "").trim();
      if (!title) return;
      const url = n.url || n.content_source_url || "";
      items.push({
        id: `${articleId || "art"}-${idx}`,
        articleId: String(articleId),
        title,
        author: n.author || MP_NAME,
        digest: digestOf(n),
        url,
        thumbUrl: n.thumb_url || "",
        publishedAt: row.update_time
          ? new Date(Number(row.update_time) * 1000).toISOString()
          : "",
        showCover: n.show_cover_pic === 1,
      });
    });
  }
  return items;
}

async function fetchBatch(token, pathname, bodyBase, idKey) {
  const items = [];
  let offset = 0;
  const pageSize = 20;
  let total = Infinity;

  while (items.length < MAX_ITEMS && offset < total) {
    const json = await apiPost(token, pathname, {
      ...bodyBase,
      offset,
      count: Math.min(pageSize, MAX_ITEMS - items.length),
    });
    if (json.errcode) {
      const err = new Error(
        `${pathname} 失败: ${json.errcode} ${json.errmsg || ""}`,
      );
      err.code = json.errcode;
      throw err;
    }
    total = Number(json.total_count ?? 0);
    const batch = json.item || [];
    if (!batch.length) break;
    items.push(...mapNewsRows(batch, idKey));
    offset += batch.length;
    if (batch.length < pageSize) break;
  }
  return { total, items: items.slice(0, MAX_ITEMS) };
}

function readUrlFile() {
  if (!fs.existsSync(URLS_FILE)) return [];
  return fs
    .readFileSync(URLS_FILE, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function pickMeta(html, prop) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
    "i",
  );
  return decodeEntities(html.match(re)?.[1] || html.match(re2)?.[1] || "");
}

async function fetchArticleMeta(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw new Error(`打开文章失败 HTTP ${res.status}: ${url}`);
  }
  const finalUrl = res.url || url;
  if (isPreviewUrl(finalUrl)) {
    throw new Error(`仍是预览链（tempkey），不是发表记录永久链: ${url}`);
  }
  const html = await res.text();
  const title =
    pickMeta(html, "og:title") ||
    pickMeta(html, "twitter:title") ||
    decodeEntities(html.match(/<title>([^<]+)<\/title>/i)?.[1] || "").replace(
      /\s*-\s*微信公众平台\s*$/,
      "",
    );
  const digest =
    pickMeta(html, "og:description") ||
    pickMeta(html, "description") ||
    "";
  const thumbUrl = pickMeta(html, "og:image") || "";
  const publishUnix =
    html.match(/var\s+createTime\s*=\s*['"](\d+)['"]/)?.[1] ||
    html.match(/publish_time['"]?\s*[:=]\s*['"]?(\d{10})/)?.[1] ||
    "";
  if (!title) throw new Error(`未能解析标题: ${url}`);
  const id = crypto.createHash("sha1").update(finalUrl).digest("hex").slice(0, 16);
  return {
    id,
    articleId: id,
    title: title.trim(),
    author: MP_NAME,
    digest: digest.slice(0, 160),
    url: finalUrl.startsWith("http") ? finalUrl : url,
    thumbUrl,
    publishedAt: publishUnix
      ? new Date(Number(publishUnix) * 1000).toISOString()
      : "",
    showCover: Boolean(thumbUrl),
  };
}

async function fetchFromUrlFile() {
  const urls = readUrlFile();
  const permanent = urls.filter(isPermanentMpUrl);
  const skipped = urls.length - permanent.length;
  if (skipped > 0) {
    console.warn(`跳过 ${skipped} 条非永久/非法链接（含 tempkey 预览链）`);
  }
  if (!permanent.length) {
    return { total: 0, items: [], source: "wechat-mp-url-file", mode: "url-file" };
  }
  const items = [];
  for (const url of permanent.slice(0, MAX_ITEMS)) {
    process.stdout.write(`  · 拉取 ${url.slice(0, 48)}... `);
    try {
      const meta = await fetchArticleMeta(url);
      items.push(meta);
      console.log("ok", meta.title.slice(0, 24));
    } catch (e) {
      console.log("失败", e.message);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return {
    total: items.length,
    items,
    source: "wechat-mp-url-file",
    mode: "url-file",
  };
}

async function fetchArticles(token) {
  // 1) 官方已发表列表（企业认证号等）
  try {
    const published = await fetchBatch(
      token,
      "/cgi-bin/freepublish/batchget",
      { no_content: 0 },
      "article_id",
    );
    const items = published.items.filter(
      (it) => it.url && !isPreviewUrl(it.url),
    );
    return {
      total: published.total,
      items: items.slice(0, MAX_ITEMS),
      source: "wechat-mp-freepublish",
      mode: "published",
    };
  } catch (e) {
    if (e.code !== 48001 && e.code !== 61004) throw e;
    console.warn(
      `已发表列表 API 不可用（${e.code}）。个人号常见。改走「发表记录永久链接」文件。`,
    );
  }

  // 2) 永久链接清单（证实已发布）
  const fromFile = await fetchFromUrlFile();
  if (fromFile.items.length) return fromFile;

  // 3) 调试才允许草稿（默认不上站）
  if (ALLOW_DRAFT) {
    console.warn("WECHAT_MP_ALLOW_DRAFT=1，使用草稿箱（不能证明已发表）");
    const drafts = await fetchBatch(
      token,
      "/cgi-bin/draft/batchget",
      { no_content: 0 },
      "media_id",
    );
    return { ...drafts, source: "wechat-mp-draft", mode: "draft-debug" };
  }

  return {
    total: 0,
    items: [],
    source: "wechat-mp-none",
    mode: "need-urls",
  };
}

const token = await getAccessToken();
console.log("已获取 access_token（未打印）");
const { total, items, source, mode } = await fetchArticles(token);
console.log(
  `模式=${mode} total≈${total}，本次写入 ${items.length} 条（source=${source}）`,
);

const noteByMode = {
  published: "来自微信「已发表」接口；本站展示标题/摘要并链到原文。密钥勿入库。",
  "url-file":
    "个人号无已发表接口权限。本站仅收录 data/wechat-mp-published-urls.txt 中的永久链接（发表记录复制），可证实已发布。",
  "need-urls":
    "尚未配置已发表永久链接。请打开公众平台 → 内容管理 → 发表记录，复制文章链接到 data/wechat-mp-published-urls.txt 后重跑 npm run wechat:sync。",
  "draft-debug":
    "调试模式：草稿箱内容，不能证明已发表，请勿用于生产展示。",
};

const payload = {
  syncedAt: new Date().toISOString(),
  source,
  mode,
  accountName: MP_NAME,
  appIdMasked: APPID ? `${APPID.slice(0, 6)}…${APPID.slice(-4)}` : "",
  totalCount: total,
  itemCount: items.length,
  note: noteByMode[mode] || noteByMode["need-urls"],
  items,
};

const outSrc = path.join(root, "src/data/wechat-mp.generated.json");
const outPub = path.join(root, "public/data/wechat-mp.json");
fs.mkdirSync(path.dirname(outPub), { recursive: true });
fs.writeFileSync(outSrc, JSON.stringify(payload, null, 2) + "\n");
fs.writeFileSync(outPub, JSON.stringify(payload, null, 2) + "\n");
console.log(`已写入 ${path.relative(root, outSrc)} 与 public/data/wechat-mp.json`);

if (mode === "need-urls") {
  console.log(`\n请编辑: ${path.relative(root, URLS_FILE)}`);
  process.exitCode = 2;
}
