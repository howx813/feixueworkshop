/**
 * 预检通过后部署到 CloudBase，并保留可回退快照 + Git tag。
 *
 * 回退本地快照：npm run rollback
 * 从 Git tag 上线：npm run release:from -- v0.2.4
 * 列表：npm run rollback -- --list
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envId = process.env.TCB_ENV_ID || "howx813-d7gx02spb2681185c";
const historyDir = path.join(root, ".deploy-history");
const keep = Number(process.env.DEPLOY_HISTORY_KEEP || 8);
const siteUrl = `https://${envId}-1456523152.tcloudbaseapp.com`;

function run(cmd, args, inherit = true) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
    stdio: inherit ? "inherit" : "pipe",
    shell: process.platform === "win32",
  });
  return r;
}

function runCode(cmd, args, inherit = true) {
  return run(cmd, args, inherit).status ?? 1;
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    "-" +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  );
}

function gitInfo() {
  const sha = run("git", ["rev-parse", "--short", "HEAD"], false);
  const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"], false);
  return {
    sha: (sha.stdout || "unknown").trim(),
    branch: (branch.stdout || "unknown").trim(),
  };
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function pruneHistory() {
  if (!fs.existsSync(historyDir)) return;
  const dirs = fs
    .readdirSync(historyDir)
    .filter((n) => fs.statSync(path.join(historyDir, n)).isDirectory())
    .filter((n) => n.endsWith("-out") || n.endsWith("-live"))
    .sort()
    .reverse();
  // group by timestamp prefix
  const stamps = [
    ...new Set(dirs.map((n) => n.replace(/-(out|live)$/, ""))),
  ].sort().reverse();
  for (const s of stamps.slice(keep)) {
    for (const suffix of ["-out", "-live"]) {
      const p = path.join(historyDir, s + suffix);
      if (fs.existsSync(p)) {
        fs.rmSync(p, { recursive: true, force: true });
        console.log("  清理旧快照", path.basename(p));
      }
    }
    const meta = path.join(historyDir, `${s}.json`);
    if (fs.existsSync(meta)) fs.unlinkSync(meta);
  }
}

console.log("→ 1/4 部署前预检…");
if (runCode("node", ["scripts/predeploy-check.mjs"]) !== 0) {
  console.error("\n预检未通过，已中止部署。");
  process.exit(1);
}

const id = stamp();
const git = gitInfo();
fs.mkdirSync(historyDir, { recursive: true });

console.log("\n→ 2/4 备份当前线上版本（用于回退）…");
const liveDir = path.join(historyDir, `${id}-live`);
fs.mkdirSync(liveDir, { recursive: true });
const dl = run(
  "tcb",
  ["hosting", "download", "/", liveDir, "--dir", "-e", envId],
  true,
);
const liveOk = (dl.status ?? 1) === 0;
if (!liveOk) {
  console.warn(
    "  ⚠ 线上快照下载失败（可能是首次部署或权限）。仍会备份本地 out/ 作为回退点。",
  );
}

console.log("\n→ 3/4 备份本次将上传的 out/ …");
const outDir = path.join(root, "out");
const outSnap = path.join(historyDir, `${id}-out`);
if (!fs.existsSync(outDir)) {
  console.error("缺少 out/，预检应已生成");
  process.exit(1);
}
copyDir(outDir, outSnap);

const meta = {
  id,
  createdAt: new Date().toISOString(),
  envId,
  siteUrl,
  git,
  liveSnapshot: liveOk,
  paths: {
    out: `${id}-out`,
    live: liveOk ? `${id}-live` : null,
  },
  note: "回退到部署前线上：npm run rollback（默认用本快照的 -live）",
};
fs.writeFileSync(
  path.join(historyDir, `${id}.json`),
  JSON.stringify(meta, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(historyDir, "LATEST.json"),
  JSON.stringify(meta, null, 2) + "\n",
);

// PREVIOUS = 上一次 LATEST（若存在）
const prevPath = path.join(historyDir, "PREVIOUS.json");
const latestPath = path.join(historyDir, "LATEST.json");
// 在写入 LATEST 前，若已有旧 LATEST 且 id 不同，挪到 PREVIOUS
// 这里 LATEST 刚写成本次，需要从历史里找上一个
const allMeta = fs
  .readdirSync(historyDir)
  .filter((n) => n.endsWith(".json") && n !== "LATEST.json" && n !== "PREVIOUS.json")
  .sort()
  .reverse();
if (allMeta.length >= 2) {
  const prevId = allMeta[1].replace(/\.json$/, "");
  const prevMeta = JSON.parse(
    fs.readFileSync(path.join(historyDir, allMeta[1]), "utf8"),
  );
  fs.writeFileSync(prevPath, JSON.stringify(prevMeta, null, 2) + "\n");
  console.log("  PREVIOUS 指向", prevId);
}

console.log("\n→ 4/5 上传 out/ 到 CloudBase …");
const code = runCode("tcb", ["hosting", "deploy", "out", "-e", envId]);
if (code !== 0) {
  console.error("部署失败。可尝试：npm run rollback 回到 -live 快照（若下载成功）");
  process.exit(code);
}

console.log("\n→ 5/5 打 Git 发版 tag（与 changelog 版本对齐）…");
const tagSkip = process.argv.includes("--no-tag");
let releaseTag = "";
if (tagSkip) {
  console.log("  已跳过 tag（--no-tag）");
} else {
  const tagRun = run("node", ["scripts/release-tag.mjs"], true);
  if ((tagRun.status ?? 1) !== 0) {
    console.warn("  ⚠ 打 tag / 推送失败，线上已更新；请手动: npm run release:tag");
  } else {
    try {
      const { readChangelogVersion, tagName } = await import("./version.mjs");
      releaseTag = tagName(readChangelogVersion());
      meta.gitTag = releaseTag;
      fs.writeFileSync(
        path.join(historyDir, `${id}.json`),
        JSON.stringify(meta, null, 2) + "\n",
      );
      fs.writeFileSync(
        path.join(historyDir, "LATEST.json"),
        JSON.stringify(meta, null, 2) + "\n",
      );
    } catch {
      /* ignore */
    }
  }
}

pruneHistory();

console.log(`
================================================
部署完成
  线上: ${siteUrl}
  本次快照: ${id}
  代码: ${git.branch}@${git.sha}
  Git tag: ${releaseTag || "(未打上)"}
  本地快照回退: npm run rollback
  从 tag 重新上线: npm run release:from -- ${releaseTag || "vX.Y.Z"}
  列表快照: npm run rollback -- --list
  列表 tags: git tag -l 'v*'
================================================
`);
process.exit(0);
