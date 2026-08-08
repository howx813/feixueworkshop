/**
 * 51la OpenAPI 探测（type=2 中等加密）
 * 用法: LA51_AK=xxx LA51_SK=yyy node tmp/probe-51la.mjs /sitegroup/list '{}'
 */
import crypto from "node:crypto";

const AK = process.env.LA51_AK;
const SK = process.env.LA51_SK;
if (!AK || !SK) {
  console.error("需要 LA51_AK / LA51_SK 环境变量");
  process.exit(1);
}

const path = process.argv[2] || "/sitegroup/list";
const params = process.argv[3] ? JSON.parse(process.argv[3]) : {};

const nonce = Math.random().toString(36).slice(-4);
const timestamp = Date.now();
const signParams = { accessKey: AK, nonce, timestamp, secretKey: SK };
const queryString = Object.keys(signParams)
  .sort((a, b) => a.localeCompare(b))
  .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(signParams[k])}`)
  .join("&");
const sign = crypto
  .createHash("sha256")
  .update(queryString)
  .digest("hex")
  .toUpperCase();

const res = await fetch(`https://v6-open.51.la/open${path}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...params, accessKey: AK, nonce, timestamp, sign }),
  signal: AbortSignal.timeout(15000),
});
const text = await res.text();
console.log(`HTTP ${res.status}`);
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2).slice(0, 4000));
} catch {
  console.log(text.slice(0, 2000));
}
