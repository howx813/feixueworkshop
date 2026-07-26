/**
 * 从 GitHub tag 检出代码、构建并部署到腾讯云。
 * 用 git worktree，不弄脏当前工作区。
 *
 * 用法:
 *   npm run release:from -- v0.2.4
 *   npm run release:from -- 0.2.4
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { tagName } from "./version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envId = process.env.TCB_ENV_ID || "howx813-d7gx02spb2681185c";

const raw = process.argv[2];
if (!raw) {
  console.error("用法: npm run release:from -- v0.2.4");
  process.exit(1);
}
const tag = tagName(raw);

function run(cmd, args, cwd = root, inherit = true) {
  return spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: inherit ? "inherit" : "pipe",
    shell: process.platform === "win32",
  });
}

// ensure tag exists (fetch from origin)
console.log(`→ 拉取 tag ${tag} …`);
run("git", ["fetch", "origin", "tag", tag, "--force"], root, true);

const check = run("git", ["rev-parse", "-q", "--verify", `refs/tags/${tag}`], root, false);
if ((check.status ?? 1) !== 0) {
  // try after fetch all tags
  run("git", ["fetch", "origin", "--tags"], root, true);
  const check2 = run("git", ["rev-parse", "-q", "--verify", `refs/tags/${tag}`], root, false);
  if ((check2.status ?? 1) !== 0) {
    console.error(`找不到 tag ${tag}。先: git tag -l 或 npm run release:tag`);
    process.exit(1);
  }
}

const work = path.join(os.tmpdir(), `feixue-release-${tag.replace(/[^\w.-]/g, "_")}-${Date.now()}`);
console.log(`→ worktree: ${work}`);

const add = run("git", ["worktree", "add", "--detach", work, tag], root, true);
if ((add.status ?? 1) !== 0) {
  console.error("创建 worktree 失败");
  process.exit(1);
}

try {
  console.log("→ npm ci / install …");
  let inst = run("npm", ["ci"], work, true);
  if ((inst.status ?? 1) !== 0) {
    inst = run("npm", ["install"], work, true);
  }
  if ((inst.status ?? 1) !== 0) {
    throw new Error("依赖安装失败");
  }

  console.log("→ 预检 …");
  const pre = run("npm", ["run", "test:predeploy"], work, true);
  if ((pre.status ?? 1) !== 0) {
    throw new Error("预检失败，未部署");
  }

  // backup live then deploy out from worktree
  const historyDir = path.join(root, ".deploy-history");
  fs.mkdirSync(historyDir, { recursive: true });
  const id = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 15);
  const liveDir = path.join(historyDir, `${id}-from-${tag}-live`);
  console.log("→ 备份当前线上 …");
  run("tcb", ["hosting", "download", "/", liveDir, "--dir", "-e", envId], root, true);

  const outDir = path.join(work, "out");
  if (!fs.existsSync(outDir)) {
    throw new Error("预检后缺少 out/");
  }
  // also copy out snapshot
  const outSnap = path.join(historyDir, `${id}-from-${tag}-out`);
  fs.cpSync(outDir, outSnap, { recursive: true });

  console.log("→ 上传该版本 out/ …");
  const dep = run("tcb", ["hosting", "deploy", outDir, "-e", envId], root, true);
  if ((dep.status ?? 1) !== 0) {
    throw new Error("部署失败");
  }

  console.log(`
================================================
已从 Git tag 上线
  tag: ${tag}
  线上: https://${envId}-1456523152.tcloudbaseapp.com
  快照: ${id}-from-${tag}-*
  回退本地快照: npm run rollback -- --list
================================================
`);
} catch (e) {
  console.error(e.message || e);
  process.exitCode = 1;
} finally {
  console.log("→ 清理 worktree …");
  run("git", ["worktree", "remove", "--force", work], root, true);
}
