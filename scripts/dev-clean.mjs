/**
 * 清掉损坏的 .next 缓存后启动 dev。
 *
 * 症状：CSS 404/500、Cannot find module './xxx.js'、页面无样式。
 * 原因：npm run build 与 npm run dev 交替写 .next 导致 chunk 对不上。
 *
 * 用法: npm run dev:clean
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const nextDir = path.join(root, ".next");
const port = process.env.PORT || "3456";

function killPort(p) {
  try {
    const r = spawnSync("lsof", [`-tiTCP:${p}`, "-sTCP:LISTEN"], {
      encoding: "utf8",
    });
    const pids = (r.stdout || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGKILL");
        console.log(`  已结束占用 ${p} 的进程 PID ${pid}`);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* lsof 不可用时忽略 */
  }
}

console.log("→ 释放端口", port);
killPort(port);

console.log("→ 删除 .next 缓存");
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("  已删除", nextDir);
} else {
  console.log("  .next 不存在，跳过");
}

console.log(`→ 启动 next dev -p ${port}\n`);
const child = spawn("npx", ["next", "dev", "-p", String(port)], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    child.kill(sig);
  });
}
