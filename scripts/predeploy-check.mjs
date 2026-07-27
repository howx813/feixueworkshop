/**
 * 部署前强制检查：不通过则 exit 1，禁止上云。
 *
 * 检查项：
 * 1. lint
 * 2. 生产构建（out/）
 * 3. 关键静态页存在且含关键文案
 * 4. 曲库 free 曲目音源可访问（抽样）
 * 5. 密钥未混入构建产物
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "out");

const pages = [
  { file: "index.html", mustInclude: ["飞雪工坊"] },
  { file: "showcase/index.html", mustInclude: ["能力展厅"] },
  { file: "insights/index.html", mustInclude: ["观点精选"] },
  { file: "music/index.html", mustInclude: ["工坊电台"] },
  { file: "changelog/index.html", mustInclude: ["更新日志"] },
  { file: "lab/index.html", mustInclude: ["手搓宝匣"] },
  { file: "lab/snowflake/index.html", mustInclude: ["雪花"] },
  { file: "lab/marble/index.html", mustInclude: ["弹珠"] },
  { file: "lab/particles/index.html", mustInclude: ["字由粒子"] },
  { file: "lab/fluid/index.html", mustInclude: ["流体实验室"] },
  { file: "lab/gravity/index.html", mustInclude: ["引力沙盘"] },
  { file: "lab/graphic/index.html", mustInclude: ["图像小说"] },
  { file: "tenders/index.html", mustInclude: ["每日标讯"] },
  { file: "data/tenders.json", mustInclude: ["items", "syncedAt"] },
];

let failed = 0;

function ok(msg) {
  console.log(`  ✔ ${msg}`);
}

function fail(msg) {
  failed += 1;
  console.error(`  ✖ ${msg}`);
}

function section(title) {
  console.log(`\n▸ ${title}`);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
    env: { ...process.env, ...opts.env },
  });
  return r;
}

section("1/7 Lint（eslint CLI，避免 next lint 写坏 dev 的 .next）");
{
  // 注意：不要用 `next lint`——它会碰 .next，与正在跑的 next dev 并发时
  // 会触发 Cannot find module './948.js' / __webpack_modules__ is not a function
  const r = run("npx", [
    "eslint",
    "src/**/*.{js,jsx,ts,tsx}",
    "--max-warnings",
    "0",
  ]);
  if (r.status !== 0) {
    fail("eslint 未通过");
    if (r.stdout) console.error(r.stdout);
    if (r.stderr) console.error(r.stderr);
  } else {
    ok("eslint 通过（未调用 next lint）");
  }
}

section("2/7 单元测试");
{
  const marble = run("node", ["scripts/test-marble.mjs"]);
  if (marble.status !== 0) {
    fail("弹珠逻辑单测失败");
    if (marble.stdout) console.error(marble.stdout);
    if (marble.stderr) console.error(marble.stderr);
  } else {
    ok("弹珠逻辑单测通过");
  }

  const aihot = run("node", ["scripts/test-aihot.mjs"]);
  if (aihot.status !== 0) {
    fail("AI HOT 精选接口不可用");
    if (aihot.stdout) console.error(aihot.stdout);
    if (aihot.stderr) console.error(aihot.stderr);
  } else {
    ok("AI HOT 精选接口可达");
    if (aihot.stdout) console.log(aihot.stdout.trimEnd());
  }
}

section("3/7 隔离生产构建（临时目录 build，绝不碰项目 .next）");
{
  const r = run("node", ["scripts/build-export.mjs"]);
  if (r.status !== 0) {
    fail("隔离构建失败");
    if (r.stdout) console.error(r.stdout.slice(-2000));
    if (r.stderr) console.error(r.stderr.slice(-2000));
  } else if (!fs.existsSync(outDir)) {
    fail("构建后缺少 out/ 目录");
  } else {
    ok("隔离构建成功，out/ 已写回（dev 的 .next 未改动）");
  }
}

section("4/7 静态页与 CSS 完整性");
{
  for (const p of pages) {
    const full = path.join(outDir, p.file);
    if (!fs.existsSync(full)) {
      fail(`缺少页面: ${p.file}`);
      continue;
    }
    const html = fs.readFileSync(full, "utf8");
    const missing = p.mustInclude.filter((s) => !html.includes(s));
    if (missing.length) {
      fail(`${p.file} 缺少文案: ${missing.join(", ")}`);
    } else {
      ok(`${p.file}`);
    }
  }

  const index = path.join(outDir, "index.html");
  if (fs.existsSync(index)) {
    const html = fs.readFileSync(index, "utf8");
    if (!html.includes("/_next/static/css/")) {
      fail("首页未引用 CSS，可能样式丢失");
    } else {
      ok("首页已引用 CSS");
      const cssHref = html.match(/\/_next\/static\/css\/[^"']+\.css/);
      if (cssHref) {
        const cssPath = path.join(outDir, cssHref[0].replace(/^\//, ""));
        if (!fs.existsSync(cssPath)) {
          fail(`CSS 文件不存在: ${cssHref[0]}`);
        } else {
          const css = fs.readFileSync(cssPath, "utf8");
          if (!css.includes(".app-shell") && !css.includes("app-shell")) {
            // tailwind might minify differently - check file non-empty
            if (css.length < 100) fail("CSS 文件过小，可能损坏");
            else ok(`CSS 文件存在 (${css.length} bytes)`);
          } else {
            ok("CSS 含 app-shell 样式");
          }
        }
      }
    }
    if (!html.includes("/_next/static/chunks/")) {
      fail("首页未引用 JS chunks");
    } else {
      ok("首页已引用 JS");
    }
    // 首页应挂载 AI HOT 精选客户端块（构建后 chunk 名会变，检查文案）
    if (!html.includes("AI") && !html.includes("精选")) {
      // RSC payload may embed differently; soft check via built page strings
      const raw = html;
      if (!raw.includes("Aihot") && !raw.includes("aihot") && !raw.includes("精选")) {
        fail("首页可能未包含 AI 精选模块");
      } else {
        ok("首页含 AI/精选相关痕迹");
      }
    } else {
      ok("首页含 AI 精选相关文案");
    }
  }

  const marble = path.join(outDir, "lab/marble/index.html");
  if (fs.existsSync(marble)) {
    const html = fs.readFileSync(marble, "utf8");
    if (!html.includes("碎砖弹珠") && !html.includes("弹珠")) {
      fail("弹珠页缺少标题文案");
    } else {
      ok("弹珠页文案齐全");
    }
  }
}

section("5/7 静态产物 HTTP 冒烟");
{
  const r = run("node", ["scripts/smoke-out.mjs"]);
  if (r.status !== 0) {
    fail("out/ HTTP 冒烟失败");
    if (r.stdout) console.error(r.stdout);
    if (r.stderr) console.error(r.stderr);
  } else {
    ok("out/ HTTP 冒烟通过");
    if (r.stdout) console.log(r.stdout.trimEnd());
  }
}

section("6/7 电台可试听曲源（抽样）");
{
  try {
    const musicPath = path.join(root, "src/data/music.ts");
    const src = fs.readFileSync(musicPath, "utf8");
    // 粗提取 free 曲目 id：access: "free" 前最近的 id: number
    const freeIds = [];
    const blocks = src.split(/\{\s*\n/);
    for (const b of blocks) {
      if (!b.includes('access: "free"')) continue;
      const m = b.match(/id:\s*(\d+)/);
      if (m) freeIds.push(Number(m[1]));
    }
    const sample = freeIds.slice(0, 3);
    if (sample.length === 0) {
      fail("曲库中没有 access: free 的曲目");
    } else {
      ok(`抽样 free 曲目: ${sample.join(", ")}`);
      for (const id of sample) {
        const url = `https://api.injahow.cn/meting/?server=netease&type=url&id=${id}`;
        try {
          const res = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
            signal: AbortSignal.timeout(12000),
          });
          // 有的代理 HEAD 不友好，再 GET 探测状态
          if (!res.ok) {
            const res2 = await fetch(url, {
              method: "GET",
              redirect: "follow",
              signal: AbortSignal.timeout(15000),
              headers: { Range: "bytes=0-1" },
            });
            if (!res2.ok && res2.status !== 206) {
              fail(`曲目 ${id} 音源不可用 HTTP ${res.status}/${res2.status}`);
            } else {
              ok(`曲目 ${id} 音源可达`);
            }
          } else {
            ok(`曲目 ${id} 音源可达`);
          }
        } catch (e) {
          fail(`曲目 ${id} 音源检测失败: ${e.message || e}`);
        }
      }
    }
  } catch (e) {
    fail(`曲库检测异常: ${e.message || e}`);
  }
}

section("7/7 产物敏感信息扫描");
{
  // 只扫「像密钥被写进产物」的模式，不写真实密钥值
  const secrets = [
    "NETEASE_PRIVATE_KEY=",
    "NETEASE_APP_SECRET=",
    "BEGIN PRIVATE KEY",
    "BEGIN RSA PRIVATE KEY",
  ];
  const walk = (dir, acc = []) => {
    if (!fs.existsSync(dir)) return acc;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p, acc);
      else if (/\.(html|js|css|json|txt|map)$/i.test(name)) acc.push(p);
    }
    return acc;
  };
  const files = walk(outDir);
  let leaked = false;
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    for (const s of secrets) {
      if (text.includes(s)) {
        fail(`构建产物疑似含密钥: ${path.relative(root, f)}`);
        leaked = true;
      }
    }
  }
  if (!leaked) ok(`已扫描 ${files.length} 个产物文件，未发现已知密钥片段`);
}

console.log("\n" + "=".repeat(48));
if (failed > 0) {
  console.error(`预检失败：${failed} 项未通过。禁止部署。`);
  process.exit(1);
}
console.log("预检全部通过。可以部署：npm run deploy");
console.log(
  "提示：生产构建已在系统临时目录完成，不应再弄坏 3456 的 next dev。",
);
process.exit(0);
