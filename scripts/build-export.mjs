/**
 * 隔离构建：在系统临时目录里跑 next build，再把 out/ 拷回项目。
 *
 * 解决：next build 与 next dev 并行时反复弄坏 .next
 * （Cannot find module './948.js' / __webpack_modules__ is not a function / CSS 500）
 *
 * 原理：构建目录不在项目内，dev 用的 .next 完全不被触碰。
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDest = path.join(root, "out");

function run(cmd, args, cwd, inherit = true) {
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: inherit ? "inherit" : "pipe",
    env: { ...process.env, EXPORT: "1" },
    shell: process.platform === "win32",
  });
  return r.status ?? 1;
}

function copyFiltered(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const skip = new Set([
    "node_modules",
    ".next",
    ".next-export",
    "out",
    ".deploy-history",
    ".git",
    ".DS_Store",
  ]);

  for (const name of fs.readdirSync(src)) {
    if (skip.has(name)) continue;
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = fs.statSync(from);
    if (st.isDirectory()) {
      copyFiltered(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), "feixue-export-"));
console.log("→ 隔离构建目录:", work);

try {
  console.log("→ 复制源码（排除 .next / node_modules / out）…");
  copyFiltered(root, work);

  const nm = path.join(root, "node_modules");
  const link = path.join(work, "node_modules");
  if (!fs.existsSync(nm)) {
    console.error("项目缺少 node_modules，请先 npm install");
    process.exit(1);
  }
  // 符号链接复用依赖，避免每次全量安装
  fs.symlinkSync(nm, link, "junction");

  // 构建产物与缓存都放在临时目录内
  const nextConfigOverride = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: ".next",
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};
export default nextConfig;
`;
  fs.writeFileSync(path.join(work, "next.config.mjs"), nextConfigOverride);

  console.log("→ 在隔离目录执行 next build …");
  const code = run("npx", ["next", "build"], work, true);
  if (code !== 0) {
    console.error("隔离构建失败");
    process.exit(code);
  }

  const builtOut = path.join(work, "out");
  if (!fs.existsSync(builtOut)) {
    console.error("构建后临时目录缺少 out/");
    process.exit(1);
  }

  console.log("→ 写回项目 out/ …");
  fs.rmSync(outDest, { recursive: true, force: true });
  fs.cpSync(builtOut, outDest, { recursive: true });

  console.log("✔ 隔离构建完成 →", outDest);
  console.log("  （未修改项目内 .next，dev 可继续使用）");
} finally {
  try {
    fs.rmSync(work, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}
