/**
 * 根据 changelog 顶部版本打 git tag 并推送到 GitHub。
 *
 * 用法:
 *   node scripts/release-tag.mjs           # 打 tag + push
 *   node scripts/release-tag.mjs --dry     # 只打印
 *   node scripts/release-tag.mjs --no-push # 只本地 tag
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readChangelogVersion, tagName } from "./version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dry = process.argv.includes("--dry");
const noPush = process.argv.includes("--no-push");

function run(args, inherit = false) {
  return spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: inherit ? "inherit" : "pipe",
  });
}

const version = readChangelogVersion();
const tag = tagName(version);

// sync package.json version
const pkgPath = path.join(root, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
if (pkg.version !== version) {
  pkg.version = version;
  if (!dry) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`已同步 package.json version → ${version}`);
  } else {
    console.log(`[dry] 将同步 package.json version → ${version}`);
  }
}

const existing = run(["rev-parse", "-q", "--verify", `refs/tags/${tag}`]);
if ((existing.status ?? 1) === 0) {
  console.log(`tag ${tag} 已存在，跳过创建`);
} else {
  const msg = `release ${tag}`;
  if (dry) {
    console.log(`[dry] git tag -a ${tag} -m "${msg}"`);
  } else {
    const t = run(["tag", "-a", tag, "-m", msg], true);
    if ((t.status ?? 1) !== 0) {
      console.error("创建 tag 失败");
      process.exit(1);
    }
    console.log(`已创建 tag ${tag}`);
  }
}

if (!noPush && !dry) {
  const p = run(["push", "origin", tag], true);
  if ((p.status ?? 1) !== 0) {
    // try push --tags
    const p2 = run(["push", "origin", "--tags"], true);
    if ((p2.status ?? 1) !== 0) {
      console.error("推送 tag 失败，请检查 git remote / 登录");
      process.exit(1);
    }
  }
  console.log(`已推送 ${tag} → origin`);
} else if (dry) {
  console.log(`[dry] git push origin ${tag}`);
}

console.log(`\n版本 ${version} 对应 tag: ${tag}`);
console.log(`从该版本重新上线: npm run release:from -- ${tag}`);
