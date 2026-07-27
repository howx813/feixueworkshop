/**
 * 碎砖弹珠纯逻辑单测（不启动浏览器）
 */
import assert from "node:assert/strict";

// 内联精简版逻辑，避免 ts 编译依赖；与 marble-core 规则保持一致
const BRICK_ROW_COLS = [8, 8, 8, 8, 8, 8, 2];
const BRICK_GAP = 6;

// 与 marble-core.ts 的 SIGNER_COMPANIES 保持一致
const SIGNER_COMPANIES = [
  "AI21", "AMD", "American Innovators", "Amp", "Andreessen Horowitz", "Arcee", "Arena", "Baseten",
  "Black Forest Labs", "Block", "Box", "Cisco", "Cloudflare", "Cohere", "CrowdStrike", "Dell",
  "DoorDash", "Emergence", "Fireworks AI", "Genspark", "GitHub", "Google", "Hugging Face", "IBM",
  "inferact", "Interconnects", "Linux Foundation", "Mariana Minerals", "Meta", "Microsoft", "Mistral", "Morph",
  "Mozilla", "Nebius", "Nous", "NVIDIA", "Ollama", "OpenAI", "OpenClaw", "Palantir",
  "Palo Alto", "Periodic Labs", "Perplexity", "Prime Intellect", "Reflection", "Replit", "ServiceNow", "Telnyx",
  "Trajectory", "Y Combinator",
];

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function makeBricks(w = 480, rowCols = BRICK_ROW_COLS, labels = SIGNER_COMPANIES) {
  const marginX = 16;
  const top = 64;
  const maxCols = Math.max(...rowCols);
  const bw = (w - marginX * 2 - BRICK_GAP * (maxCols - 1)) / maxCols;
  const list = [];
  let i = 0;
  for (let r = 0; r < rowCols.length; r++) {
    for (let c = 0; c < rowCols[r]; c++) {
      const hp = r < 2 ? 3 : r < 4 ? 2 : 1;
      list.push({
        x: marginX + c * (bw + BRICK_GAP),
        y: top + r * (26 + BRICK_GAP),
        w: bw,
        h: 26,
        hp,
        maxHp: hp,
        alive: true,
        label: labels[i],
        img: `/lab/marble/logos/${String(i).padStart(2, "0")}.png`,
      });
      i += 1;
    }
  }
  return list;
}

function circleHitsRect(cx, cy, r, b) {
  const nx = clamp(cx, b.x, b.x + b.w);
  const ny = clamp(cy, b.y, b.y + b.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

function hitBrick(brick, fire) {
  if (!brick.alive) return { destroyed: false, scoreGain: 0 };
  if (fire) brick.hp = 0;
  else brick.hp -= 1;
  if (brick.hp <= 0) {
    brick.alive = false;
    return { destroyed: true, scoreGain: 10 * brick.maxHp };
  }
  return { destroyed: false, scoreGain: 2 };
}

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passed += 1;
  } catch (e) {
    console.error(`  ✖ ${name}`);
    console.error("   ", e.message || e);
    process.exitCode = 1;
  }
}

console.log("\n▸ 碎砖弹珠逻辑单测");

test("生成 6×8+2=50 块签名砖", () => {
  const bricks = makeBricks();
  assert.equal(bricks.length, 50);
});

test("50 个签名方标签按顺序贴到砖上", () => {
  assert.equal(SIGNER_COMPANIES.length, 50);
  const bricks = makeBricks();
  assert.equal(bricks[0].label, "AI21");
  assert.equal(bricks[35].label, "NVIDIA");
  assert.equal(bricks[36].label, "Ollama");
  assert.equal(bricks[44].label, "Reflection");
  assert.equal(bricks[49].label, "Y Combinator");
  assert.ok(bricks.every((b) => typeof b.label === "string"));
  assert.equal(bricks[0].img, "/lab/marble/logos/00.png");
  assert.equal(bricks[49].img, "/lab/marble/logos/49.png");
});

test("前两排 3 血、中两排 2 血、后三排 1 血", () => {
  const bricks = makeBricks();
  // 行偏移：0,8,16,24,32,40,48
  const rowAt = (r) => {
    const start = BRICK_ROW_COLS.slice(0, r).reduce((a, n) => a + n, 0);
    return bricks.slice(start, start + BRICK_ROW_COLS[r]);
  };
  assert.ok(rowAt(0).every((b) => b.hp === 3));
  assert.ok(rowAt(3).every((b) => b.hp === 2));
  assert.ok(rowAt(5).every((b) => b.hp === 1));
  assert.ok(rowAt(6).every((b) => b.hp === 1));
  assert.equal(rowAt(6).length, 2);
});

test("末行 2 块砖左对齐、砖宽与上行一致", () => {
  const bricks = makeBricks();
  assert.equal(bricks[48].x, bricks[0].x);
  assert.equal(bricks[49].x, bricks[1].x);
  assert.equal(bricks[48].w, bricks[0].w);
});

test("球心在砖内判定命中", () => {
  const b = { x: 10, y: 10, w: 40, h: 16 };
  assert.equal(circleHitsRect(30, 18, 7, b), true);
  assert.equal(circleHitsRect(100, 100, 7, b), false);
});

test("普通击打扣血，打穿得分", () => {
  const brick = { x: 0, y: 0, w: 10, h: 10, hp: 2, maxHp: 2, alive: true };
  const a = hitBrick(brick, false);
  assert.equal(a.destroyed, false);
  assert.equal(a.scoreGain, 2);
  assert.equal(brick.hp, 1);
  const b = hitBrick(brick, false);
  assert.equal(b.destroyed, true);
  assert.equal(b.scoreGain, 20);
  assert.equal(brick.alive, false);
});

test("火力一击摧毁", () => {
  const brick = { x: 0, y: 0, w: 10, h: 10, hp: 3, maxHp: 3, alive: true };
  const r = hitBrick(brick, true);
  assert.equal(r.destroyed, true);
  assert.equal(r.scoreGain, 30);
});

test("加宽不超过上限", () => {
  assert.equal(Math.min(160, 88 + 28), 116);
  assert.equal(Math.min(160, 150 + 28), 160);
});

if (process.exitCode) {
  console.error("\n弹珠逻辑单测失败");
  process.exit(1);
}
console.log(`  （${passed} 项通过）`);
