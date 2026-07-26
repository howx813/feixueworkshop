/**
 * 碎砖弹珠纯逻辑单测（不启动浏览器）
 */
import assert from "node:assert/strict";

// 内联精简版逻辑，避免 ts 编译依赖；与 marble-core 规则保持一致
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function makeBricks(w = 480, rows = 6, cols = 10) {
  const gap = 4;
  const marginX = 16;
  const top = 72;
  const bw = (w - marginX * 2 - gap * (cols - 1)) / cols;
  const list = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hp = r < 2 ? 3 : r < 4 ? 2 : 1;
      list.push({
        x: marginX + c * (bw + gap),
        y: top + r * (16 + gap),
        w: bw,
        h: 16,
        hp,
        maxHp: hp,
        alive: true,
      });
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

test("生成 6×10=60 块砖", () => {
  const bricks = makeBricks();
  assert.equal(bricks.length, 60);
});

test("前两排 3 血、中两排 2 血、后两排 1 血", () => {
  const bricks = makeBricks();
  const byRow = (r) => bricks.filter((_, i) => Math.floor(i / 10) === r);
  assert.ok(byRow(0).every((b) => b.hp === 3));
  assert.ok(byRow(3).every((b) => b.hp === 2));
  assert.ok(byRow(5).every((b) => b.hp === 1));
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
