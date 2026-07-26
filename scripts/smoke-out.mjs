/**
 * 对 out/ 静态产物做本地 HTTP 冒烟（不依赖 dev 的 .next）
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "out");

const routes = [
  { path: "/", must: ["飞雪工坊", "精选"] },
  { path: "/lab/", must: ["手搓匣"] },
  { path: "/lab/marble/", must: ["弹珠"] },
  { path: "/music/", must: ["工坊电台"] },
];

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (file.endsWith(".json")) return "application/json";
  if (file.endsWith(".ico")) return "image/x-icon";
  if (file.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  if (p === "") p = "/index.html";
  const file = path.join(outDir, p.replace(/^\//, ""));
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  // trailingSlash fallback
  const asIndex = path.join(outDir, p.replace(/^\//, ""), "index.html");
  if (fs.existsSync(asIndex)) return asIndex;
  return null;
}

if (!fs.existsSync(outDir)) {
  console.error("  ✖ out/ 不存在，请先 build");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url || "/");
  if (!file) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.writeHead(200, { "Content-Type": contentType(file) });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

let failed = 0;
console.log("\n▸ 静态产物 HTTP 冒烟");

try {
  for (const r of routes) {
    const res = await fetch(base + r.path);
    const text = await res.text();
    if (!res.ok) {
      console.error(`  ✖ ${r.path} HTTP ${res.status}`);
      failed++;
      continue;
    }
    const missing = r.must.filter((s) => !text.includes(s));
    if (missing.length) {
      console.error(`  ✖ ${r.path} 缺少: ${missing.join(", ")}`);
      failed++;
    } else {
      console.log(`  ✔ ${r.path} (${text.length} bytes)`);
    }
  }

  // CSS from homepage
  const home = await (await fetch(base + "/")).text();
  const m = home.match(/\/_next\/static\/css\/[^"']+\.css/);
  if (!m) {
    console.error("  ✖ 首页无 CSS 引用");
    failed++;
  } else {
    const cssRes = await fetch(base + m[0]);
    const css = await cssRes.text();
    if (!cssRes.ok || css.length < 100) {
      console.error(`  ✖ CSS 不可用 ${m[0]}`);
      failed++;
    } else if (!css.includes("app-shell") && !css.includes("--bg-0")) {
      console.error("  ✖ CSS 内容异常");
      failed++;
    } else {
      console.log(`  ✔ CSS OK ${m[0]} (${css.length} bytes)`);
    }
  }
} finally {
  server.close();
}

if (failed) {
  console.error(`冒烟失败 ${failed} 项`);
  process.exit(1);
}
console.log("  （静态冒烟全部通过）");
