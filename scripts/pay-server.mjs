/**
 * 图像小说本机服务：微信支付订单 + 任意文本生成 10 页
 *
 * 支付（个人微信收款码无法官方回调）：
 * 1) 读者下单 → 扫码支付并备注订单号
 * 2) 手机收到「已收款」后 npm run pay:confirm -- <订单号>
 * 3) 读者端轮询 status=paid 后解锁
 *
 * 生成：
 * POST /v1/graphic/generate  { query|title } → 真实书目 5 页（封面优先实体书）
 * GET  /v1/graphic/jobs/:id
 * 有 XAI_API_KEY 时 Imagine 出图；封面优先 Open Library 真封面
 *
 * 启动: npm run pay:server
 * 环境: PAY_ADMIN_SECRET, PAY_PORT, XAI_API_KEY
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import {
  getGenerateCapabilities,
  loadGeneratedNovel,
  makeJobId,
} from "./lib/graphic-generate.mjs";
import { generateBookFivePages } from "./lib/book-five.mjs";

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

const PORT = Number(process.env.PAY_PORT || 8787);
const ADMIN_SECRET = process.env.PAY_ADMIN_SECRET || "";
const DATA_DIR = path.join(root, "data");
const ORDERS_FILE = path.join(DATA_DIR, "pay-orders.json");
const JOBS_FILE = path.join(DATA_DIR, "graphic-jobs.json");
/** @type {Map<string, object>} */
const jobsMem = new Map();

if (!ADMIN_SECRET || ADMIN_SECRET.length < 8) {
  console.warn(
    "[pay-server] 警告: 请在 .env.local 设置足够长的 PAY_ADMIN_SECRET（≥8）",
  );
}

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, "[]\n");
  }
  if (!fs.existsSync(JOBS_FILE)) {
    fs.writeFileSync(JOBS_FILE, "[]\n");
  }
}

function readOrders() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  ensureStore();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2) + "\n");
}

function readJobs() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(JOBS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeJobs(jobs) {
  ensureStore();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs.slice(0, 200), null, 2) + "\n");
}

function publicJob(job) {
  if (!job) return null;
  return {
    id: job.id,
    title: job.title,
    status: job.status,
    progress: job.progress ?? 0,
    message: job.message || "",
    mode: job.mode || null,
    error: job.error || null,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt || null,
    novel: job.novel || null,
  };
}

function upsertJob(job) {
  jobsMem.set(job.id, job);
  const list = readJobs().filter((j) => j.id !== job.id);
  list.unshift({
    id: job.id,
    title: job.title,
    status: job.status,
    progress: job.progress,
    message: job.message,
    mode: job.mode,
    error: job.error,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt,
    // novel 较大，仅 done 时落盘；运行时从 mem 读
    novel: job.status === "done" ? job.novel : undefined,
  });
  writeJobs(list);
}

function getJob(id) {
  if (jobsMem.has(id)) return jobsMem.get(id);
  const fromDisk = readJobs().find((j) => j.id === id);
  if (fromDisk) {
    if (!fromDisk.novel) {
      const novel = loadGeneratedNovel(root, id);
      if (novel) fromDisk.novel = novel;
    }
    jobsMem.set(id, fromDisk);
    return fromDisk;
  }
  const novel = loadGeneratedNovel(root, id);
  if (novel) {
    const job = {
      id,
      title: novel.title,
      status: "done",
      progress: 100,
      message: "已完成",
      mode: novel.mode,
      createdAt: novel.createdAt,
      finishedAt: novel.createdAt,
      novel,
    };
    jobsMem.set(id, job);
    return job;
  }
  return null;
}

function startGenerateJob({ query }) {
  const id = makeJobId();
  const job = {
    id,
    title: query,
    query,
    status: "queued",
    progress: 0,
    message: "排队中…",
    mode: null,
    error: null,
    createdAt: new Date().toISOString(),
    finishedAt: null,
    novel: null,
  };
  upsertJob(job);

  setImmediate(() => {
    void (async () => {
      try {
        job.status = "running";
        job.message = "解析书目并生成五页…";
        job.progress = 1;
        upsertJob(job);
        await generateBookFivePages({
          root,
          jobId: id,
          query,
          onProgress: (patch) => {
            Object.assign(job, patch);
            if (patch.novel) job.novel = patch.novel;
            if (patch.novel?.title) job.title = patch.novel.title;
            upsertJob(job);
          },
        });
        job.status = "done";
        job.progress = 100;
        job.finishedAt = new Date().toISOString();
        if (!job.novel) job.novel = loadGeneratedNovel(root, id);
        if (job.novel?.title) job.title = job.novel.title;
        upsertJob(job);
        console.log(`[graphic] DONE ${id} ${job.title}`);
      } catch (e) {
        job.status = "error";
        job.error = e instanceof Error ? e.message : String(e);
        job.message = job.error;
        job.finishedAt = new Date().toISOString();
        upsertJob(job);
        console.error(`[graphic] FAIL ${id}`, e);
      }
    })();
  });

  return job;
}

function json(res, status, body) {
  const raw = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Pay-Secret",
    "Cache-Control": "no-store",
  });
  res.end(raw);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function makeOrderId() {
  const t = Date.now().toString(36).toUpperCase();
  const r = randomBytes(3).toString("hex").toUpperCase();
  return `GN${t}${r}`;
}

function checkAdmin(req, body) {
  const header = req.headers["x-pay-secret"] || "";
  const fromBody = body?.secret || "";
  const secret = String(header || fromBody || "");
  return Boolean(ADMIN_SECRET) && secret === ADMIN_SECRET;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    return json(res, 204, {});
  }

  try {
    // 健康检查
    if (req.method === "GET" && url.pathname === "/v1/health") {
      const caps = getGenerateCapabilities();
      return json(res, 200, {
        ok: true,
        service: "pay-server",
        graphic: caps,
      });
    }

    // —— 图像小说生成 ——
    if (req.method === "GET" && url.pathname === "/v1/graphic/capabilities") {
      return json(res, 200, { ok: true, ...getGenerateCapabilities() });
    }

    if (req.method === "POST" && url.pathname === "/v1/graphic/generate") {
      const body = await readBody(req);
      const query = String(
        body.query || body.title || body.name || body.q || "",
      ).trim();
      if (!query) {
        return json(res, 400, {
          ok: false,
          message: "请提供书名、人物名或作品名（query）",
        });
      }
      const job = startGenerateJob({ query });
      console.log(`[graphic] start ${job.id} ${query}`);
      return json(res, 200, { ok: true, job: publicJob(job) });
    }

    const jobMatch = url.pathname.match(/^\/v1\/graphic\/jobs\/([A-Za-z0-9_-]+)$/);
    if (req.method === "GET" && jobMatch) {
      const job = getJob(jobMatch[1]);
      if (!job) return json(res, 404, { ok: false, message: "任务不存在" });
      return json(res, 200, { ok: true, job: publicJob(job) });
    }

    // 创建订单
    if (req.method === "POST" && url.pathname === "/v1/orders") {
      const body = await readBody(req);
      const novelId = String(body.novelId || "").trim();
      const from = Number(body.from);
      const to = Number(body.to);
      const yuan = Number(body.yuan || 1);
      if (!novelId || !from || !to || from > to) {
        return json(res, 400, { ok: false, message: "参数无效" });
      }
      const order = {
        id: makeOrderId(),
        novelId,
        from,
        to,
        yuan: yuan > 0 ? yuan : 1,
        status: "pending", // pending | paid | cancelled
        createdAt: new Date().toISOString(),
        paidAt: null,
        note: `请备注订单号；金额 ¥${yuan > 0 ? yuan : 1}`,
      };
      const orders = readOrders();
      orders.unshift(order);
      // 只保留最近 500 单
      writeOrders(orders.slice(0, 500));
      console.log(`[order] create ${order.id} ${novelId} p${from}-${to} ¥${order.yuan}`);
      return json(res, 200, { ok: true, order });
    }

    // 查询订单（读者轮询，无需密钥）
    const getMatch = url.pathname.match(/^\/v1\/orders\/([A-Z0-9]+)$/i);
    if (req.method === "GET" && getMatch) {
      const id = getMatch[1].toUpperCase();
      const order = readOrders().find((o) => o.id === id);
      if (!order) return json(res, 404, { ok: false, message: "订单不存在" });
      return json(res, 200, {
        ok: true,
        order: {
          id: order.id,
          novelId: order.novelId,
          from: order.from,
          to: order.to,
          yuan: order.yuan,
          status: order.status,
          createdAt: order.createdAt,
          paidAt: order.paidAt,
        },
      });
    }

    // 管理：列出 pending
    if (req.method === "GET" && url.pathname === "/v1/admin/orders") {
      const secret = url.searchParams.get("secret") || req.headers["x-pay-secret"];
      if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
        return json(res, 401, { ok: false, message: "未授权" });
      }
      const status = url.searchParams.get("status") || "pending";
      const orders = readOrders().filter((o) =>
        status === "all" ? true : o.status === status,
      );
      return json(res, 200, { ok: true, orders: orders.slice(0, 50) });
    }

    // 管理：确认到账
    if (req.method === "POST" && url.pathname.match(/^\/v1\/orders\/[A-Z0-9]+\/confirm$/i)) {
      const body = await readBody(req);
      if (!checkAdmin(req, body)) {
        return json(res, 401, { ok: false, message: "未授权" });
      }
      const id = url.pathname.split("/")[3].toUpperCase();
      const orders = readOrders();
      const idx = orders.findIndex((o) => o.id === id);
      if (idx < 0) return json(res, 404, { ok: false, message: "订单不存在" });
      if (orders[idx].status === "paid") {
        return json(res, 200, { ok: true, order: orders[idx], message: "已是已支付" });
      }
      orders[idx] = {
        ...orders[idx],
        status: "paid",
        paidAt: new Date().toISOString(),
      };
      writeOrders(orders);
      console.log(`[order] PAID ${id}`);
      return json(res, 200, { ok: true, order: orders[idx] });
    }

    // 管理：取消
    if (req.method === "POST" && url.pathname.match(/^\/v1\/orders\/[A-Z0-9]+\/cancel$/i)) {
      const body = await readBody(req);
      if (!checkAdmin(req, body)) {
        return json(res, 401, { ok: false, message: "未授权" });
      }
      const id = url.pathname.split("/")[3].toUpperCase();
      const orders = readOrders();
      const idx = orders.findIndex((o) => o.id === id);
      if (idx < 0) return json(res, 404, { ok: false, message: "订单不存在" });
      orders[idx] = { ...orders[idx], status: "cancelled" };
      writeOrders(orders);
      return json(res, 200, { ok: true, order: orders[idx] });
    }

    json(res, 404, { ok: false, message: "not found" });
  } catch (e) {
    console.error(e);
    json(res, 500, { ok: false, message: e instanceof Error ? e.message : "error" });
  }
});

server.listen(PORT, () => {
  const caps = getGenerateCapabilities();
  console.log(`[pay-server] http://127.0.0.1:${PORT}`);
  console.log(`[pay-server] 确认订单: npm run pay:confirm -- <订单号>`);
  console.log(`[pay-server] 管理页: 打开站点 /pay-admin/ （需填 PAY_ADMIN_SECRET）`);
  console.log(
    `[pay-server] 图像生成: POST /v1/graphic/generate · xAI=${caps.xaiConfigured ? "已配置" : "未配置(离线SVG)"}`,
  );
});
