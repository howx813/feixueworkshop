/**
 * 同步微信公众号「已发布图文」到静态站快照。
 *
 * 用法: npm run wechat:sync
 *
 * 环境变量（.env.local，勿提交）:
 *   WECHAT_MP_APPID=
 *   WECHAT_MP_APPSECRET=
 *   WECHAT_MP_NAME=朝诗夕文
 *   WECHAT_MP_MAX_ITEMS=30
 *
 * 前置: 公众平台 IP 白名单须包含本机公网出口 IP。
 * 注意: 2025-07 起个人主体等账号可能被回收 freepublish 接口权限。
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

const APPID = process.env.WECHAT_MP_APPID || "";
const SECRET = process.env.WECHAT_MP_APPSECRET || "";
const MP_NAME = process.env.WECHAT_MP_NAME || "公众号";
const MAX_ITEMS = Number(process.env.WECHAT_MP_MAX_ITEMS || 30);

function stripHtml(html = "") {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function digestOf(item) {
  const d = (item.digest || "").trim();
  if (d) return d.slice(0, 160);
  const plain = stripHtml(item.content || "");
  return plain.slice(0, 160);
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
        ? " → 请到公众平台把本机公网 IP 加入「IP白名单」"
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
      items.push({
        id: `${articleId || "art"}-${idx}`,
        articleId: String(articleId),
        title,
        author: n.author || MP_NAME,
        digest: digestOf(n),
        url: n.url || n.content_source_url || "",
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

/**
 * 优先已发表列表；个人主体常无 freepublish 权限，则回退草稿箱。
 * 草稿箱可能含未发表稿，且部分链接带 tempkey，站点以标题索引 + 尽量外链为准。
 */
async function fetchArticles(token) {
  try {
    const published = await fetchBatch(
      token,
      "/cgi-bin/freepublish/batchget",
      { no_content: 0 },
      "article_id",
    );
    return { ...published, source: "wechat-mp-freepublish", mode: "published" };
  } catch (e) {
    if (e.code !== 48001 && e.code !== 61004) throw e;
    console.warn(
      `已发表列表不可用（${e.code}），回退草稿箱接口。个人号常见限制。`,
    );
    const drafts = await fetchBatch(
      token,
      "/cgi-bin/draft/batchget",
      { no_content: 0 },
      "media_id",
    );
    return { ...drafts, source: "wechat-mp-draft", mode: "draft-fallback" };
  }
}

const token = await getAccessToken();
console.log("已获取 access_token（未打印）");
const { total, items, source, mode } = await fetchArticles(token);
console.log(
  `模式=${mode} total≈${total}，本次写入 ${items.length} 条（source=${source}）`,
);

const payload = {
  syncedAt: new Date().toISOString(),
  source,
  mode,
  accountName: MP_NAME,
  appIdMasked: APPID ? `${APPID.slice(0, 6)}…${APPID.slice(-4)}` : "",
  totalCount: total,
  itemCount: items.length,
  note:
    mode === "draft-fallback"
      ? "个人号无「已发表列表」权限，已从草稿箱接口同步标题/链接（可能含未发表稿；部分链接为预览链）。密钥勿入库。"
      : "正文以微信原文链接为准；本站仅同步标题/摘要/封面/链接。密钥勿入库。",
  items,
};

const outSrc = path.join(root, "src/data/wechat-mp.generated.json");
const outPub = path.join(root, "public/data/wechat-mp.json");
fs.mkdirSync(path.dirname(outPub), { recursive: true });
fs.writeFileSync(outSrc, JSON.stringify(payload, null, 2) + "\n");
fs.writeFileSync(outPub, JSON.stringify(payload, null, 2) + "\n");
console.log(`已写入 ${path.relative(root, outSrc)} 与 public/data/wechat-mp.json`);
