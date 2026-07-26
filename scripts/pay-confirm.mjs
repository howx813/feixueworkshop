/**
 * 确认微信已到账：npm run pay:confirm -- GNXXXX
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

const orderId = (process.argv[2] || "").trim().toUpperCase();
if (!orderId) {
  console.error("用法: npm run pay:confirm -- <订单号>");
  process.exit(1);
}

const base = (process.env.PAY_API_BASE || `http://127.0.0.1:${process.env.PAY_PORT || 8787}`).replace(
  /\/$/,
  "",
);
const secret = process.env.PAY_ADMIN_SECRET || "";
if (!secret) {
  console.error("缺少 PAY_ADMIN_SECRET（写在 .env.local）");
  process.exit(1);
}

const res = await fetch(`${base}/v1/orders/${orderId}/confirm`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Pay-Secret": secret,
  },
  body: JSON.stringify({ secret }),
});
const data = await res.json();
if (!res.ok || !data.ok) {
  console.error("确认失败:", data.message || res.status);
  process.exit(1);
}
console.log("已确认到账:", data.order.id, `¥${data.order.yuan}`, `p${data.order.from}-${data.order.to}`);
