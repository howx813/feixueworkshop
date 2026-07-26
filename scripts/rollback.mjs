/**
 * 回退静态托管到历史快照。
 *
 * 用法:
 *   npm run rollback              # 回退到上一版「部署前线上」快照（-live）
 *   npm run rollback -- --list    # 列出可用快照
 *   npm run rollback -- --id 20260726-153000
 *   npm run rollback -- --use out # 回退到该次构建的 out（-out）而非 live
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envId = process.env.TCB_ENV_ID || "howx813-d7gx02spb2681185c";
const historyDir = path.join(root, ".deploy-history");
const siteUrl = `https://${envId}-1456523152.tcloudbaseapp.com`;

const args = process.argv.slice(2);
const listOnly = args.includes("--list");
const idFlag = args.indexOf("--id");
const useOut = args.includes("--use") && args[args.indexOf("--use") + 1] === "out";

function listSnapshots() {
  if (!fs.existsSync(historyDir)) return [];
  return fs
    .readdirSync(historyDir)
    .filter((n) => n.endsWith(".json") && !["LATEST.json", "PREVIOUS.json"].includes(n))
    .map((n) => {
      const meta = JSON.parse(fs.readFileSync(path.join(historyDir, n), "utf8"));
      return meta;
    })
    .sort((a, b) => (a.id < b.id ? 1 : -1));
}

const snaps = listSnapshots();

if (listOnly) {
  console.log("可用部署快照（新→旧）：\n");
  if (!snaps.length) {
    console.log("  （无）请先成功执行过 npm run deploy");
    process.exit(0);
  }
  for (const s of snaps) {
    const live = s.paths?.live
      ? fs.existsSync(path.join(historyDir, s.paths.live))
        ? "live✓"
        : "live✗"
      : "live-";
    const out = s.paths?.out
      ? fs.existsSync(path.join(historyDir, s.paths.out))
        ? "out✓"
        : "out✗"
      : "out-";
    console.log(
      `  ${s.id}  ${s.createdAt || ""}  git=${s.git?.sha || "?"}  [${live} ${out}]`,
    );
  }
  console.log(`
回退示例:
  npm run rollback
  npm run rollback -- --id ${snaps[0]?.id || "TIMESTAMP"}
  npm run rollback -- --id ${snaps[0]?.id || "TIMESTAMP"} --use out
`);
  process.exit(0);
}

if (!snaps.length) {
  console.error("没有可回退快照。需要至少成功部署过一次（会生成 .deploy-history/）。");
  process.exit(1);
}

let target = null;
if (idFlag >= 0 && args[idFlag + 1]) {
  target = snaps.find((s) => s.id === args[idFlag + 1]);
  if (!target) {
    console.error("找不到快照 id:", args[idFlag + 1]);
    process.exit(1);
  }
} else {
  // 默认：用最近一次部署记录里的 -live（即「部署前的线上」）
  // 若最新一次 live 不可用，退而求其次用上一次的 -out
  target = snaps[0];
}

const kind = useOut ? "out" : "live";
let dirName = kind === "out" ? target.paths?.out : target.paths?.live;
let dir = dirName ? path.join(historyDir, dirName) : null;

if (!dir || !fs.existsSync(dir)) {
  // fallback
  if (!useOut && target.paths?.out && fs.existsSync(path.join(historyDir, target.paths.out))) {
    console.warn("live 快照不可用，改用同批 out 快照");
    dirName = target.paths.out;
    dir = path.join(historyDir, dirName);
  } else if (snaps[1]) {
    console.warn("当前快照不可用，尝试上一条…");
    target = snaps[1];
    dirName = useOut ? target.paths?.out : target.paths?.live || target.paths?.out;
    dir = dirName ? path.join(historyDir, dirName) : null;
  }
}

if (!dir || !fs.existsSync(dir)) {
  console.error("没有可上传的快照目录。执行 npm run rollback -- --list 查看。");
  process.exit(1);
}

console.log(`→ 回退上传: ${dirName}`);
console.log(`  快照 id: ${target.id}`);
console.log(`  时间: ${target.createdAt || "?"}`);
console.log(`  git: ${target.git?.sha || "?"}`);

const r = spawnSync(
  "tcb",
  ["hosting", "deploy", dir, "-e", envId],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
);

if ((r.status ?? 1) !== 0) {
  console.error("回退上传失败");
  process.exit(r.status ?? 1);
}

console.log(`
================================================
回退完成
  线上: ${siteUrl}
  已恢复快照: ${dirName}
================================================
`);
process.exit(0);
