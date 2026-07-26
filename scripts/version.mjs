/**
 * 从 src/data/changelog.ts 读取当前版本（第一条 version）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const changelogPath = path.join(root, "src/data/changelog.ts");

export function readChangelogVersion() {
  const src = fs.readFileSync(changelogPath, "utf8");
  const m = src.match(/version:\s*"(\d+\.\d+\.\d+)"/);
  if (!m) {
    throw new Error("无法从 changelog.ts 解析 version");
  }
  return m[1];
}

export function tagName(version) {
  return version.startsWith("v") ? version : `v${version}`;
}

// CLI: node scripts/version.mjs [--tag]
const self = fileURLToPath(import.meta.url);
const invoked = process.argv[1] && path.resolve(process.argv[1]) === self;
if (invoked) {
  try {
    const v = readChangelogVersion();
    console.log(process.argv.includes("--tag") ? tagName(v) : v);
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }
}
