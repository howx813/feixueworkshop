/**
 * 引力沙盘物理核心单测（不启动浏览器）
 * 内联精简版逻辑，与 src/lib/gravity-core.ts 规则保持一致
 */
import assert from "node:assert/strict";

const MAX_MASSES = 5;
const SOFT = 12;
const SOFT2 = SOFT * SOFT;
const CORE_RADIUS = 6;
const V_MAX = 420;
const FRICTION = 0.995;

function windAt(y, t, windSpeed) {
  return {
    wx: windSpeed,
    wy: windSpeed * 0.35 * Math.sin(y * 0.01 + t * 0.5),
  };
}

function accelAt(x, y, masses, G) {
  let ax = 0;
  let ay = 0;
  for (const mass of masses) {
    const dx = mass.x - x;
    const dy = mass.y - y;
    const r2 = Math.max(dx * dx + dy * dy, SOFT2);
    const inv = 1 / (r2 * Math.sqrt(r2));
    const sign = mass.kind === "attract" ? 1 : -1;
    const f = sign * G * mass.m * inv;
    ax += f * dx;
    ay += f * dy;
  }
  return { ax, ay };
}

function addMass(masses, mass) {
  const next = [...masses, mass];
  return next.length > MAX_MASSES
    ? next.slice(next.length - MAX_MASSES)
    : next;
}

function shouldRespawn(p, width, height, masses) {
  if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) return true;
  for (const mass of masses) {
    const dx = mass.x - p.x;
    const dy = mass.y - p.y;
    if (dx * dx + dy * dy < CORE_RADIUS * CORE_RADIUS) return true;
  }
  return false;
}

function respawnParticle(height) {
  return { x: 0, y: Math.random() * height, vx: 0, vy: 0 };
}

function stepParticle(p, masses, G, windSpeed, t, dt) {
  const w = windAt(p.y, t, windSpeed);
  const a = accelAt(p.x, p.y, masses, G);
  p.vx = (p.vx + a.ax * dt) * FRICTION;
  p.vy = (p.vy + a.ay * dt) * FRICTION;
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > V_MAX) {
    p.vx = (p.vx / sp) * V_MAX;
    p.vy = (p.vy / sp) * V_MAX;
  }
  p.x += (w.wx + p.vx) * dt;
  p.y += (w.wy + p.vy) * dt;
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

console.log("\n▸ 引力沙盘物理核心单测");

const attractor = { x: 100, y: 100, m: 1, kind: "attract" };
const repulsor = { x: 100, y: 100, m: 1, kind: "repel" };

test("吸引：质点右侧粒子的加速度朝左（ax < 0）", () => {
  const a = accelAt(200, 100, [attractor], 4000);
  assert.ok(a.ax < 0);
  assert.ok(Math.abs(a.ay) < 1e-9);
});

test("软化半径：粒子与质点重合时加速度有界、不发散", () => {
  const a = accelAt(100, 100, [attractor], 4000);
  assert.ok(Number.isFinite(a.ax));
  assert.ok(Number.isFinite(a.ay));
  // 极近距（1px）也不超过软化后的上界 G·m/SOFT²
  const near = accelAt(101, 100, [attractor], 4000);
  assert.ok(Math.hypot(near.ax, near.ay) <= (4000 * 1) / SOFT2 + 1e-9);
});

test("排斥：质点右侧粒子的加速度朝右（ax > 0）", () => {
  const a = accelAt(200, 100, [repulsor], 4000);
  assert.ok(a.ax > 0);
});

test("FIFO：放第 6 个质点淘汰最旧", () => {
  let masses = [];
  for (let i = 0; i < 6; i++) {
    masses = addMass(masses, { x: i * 10, y: 0, m: 1, kind: "attract" });
  }
  assert.equal(masses.length, 5);
  assert.equal(masses[0].x, 10); // x=0 的已被淘汰
  assert.equal(masses[4].x, 50);
});

test("重生判定：左/右/上/下越界都应重生", () => {
  const no = [];
  assert.ok(shouldRespawn({ x: -5, y: 50, vx: 0, vy: 0 }, 800, 600, no));
  assert.ok(shouldRespawn({ x: 805, y: 50, vx: 0, vy: 0 }, 800, 600, no));
  assert.ok(shouldRespawn({ x: 50, y: -5, vx: 0, vy: 0 }, 800, 600, no));
  assert.ok(shouldRespawn({ x: 50, y: 605, vx: 0, vy: 0 }, 800, 600, no));
  assert.ok(!shouldRespawn({ x: 50, y: 50, vx: 0, vy: 0 }, 800, 600, no));
});

test("重生判定：进入质点核心半径被吞噬", () => {
  assert.ok(
    shouldRespawn({ x: 103, y: 100, vx: 0, vy: 0 }, 800, 600, [attractor]),
  );
});

test("左缘重生：x=0、y 在界内、漂移速度归零", () => {
  for (let i = 0; i < 50; i++) {
    const p = respawnParticle(600);
    assert.equal(p.x, 0);
    assert.ok(p.y >= 0 && p.y <= 600);
    assert.equal(p.vx, 0);
    assert.equal(p.vy, 0);
  }
});

test("风场：wx 等于风速，|wy| 不超过 0.35 倍风速", () => {
  for (let t = 0; t < 10; t += 0.5) {
    const w = windAt(123.4, t, 60);
    assert.equal(w.wx, 60);
    assert.ok(Math.abs(w.wy) <= 60 * 0.35 + 1e-9);
  }
});

test("摩擦：无引力时漂移速度逐帧衰减", () => {
  const p = { x: 400, y: 300, vx: 100, vy: 0 };
  stepParticle(p, [], 4000, 0, 0, 1 / 60);
  assert.ok(Math.abs(p.vx - 100 * FRICTION) < 1e-9);
});

test("限速：漂移速度超过 V_MAX 被钳制", () => {
  const p = { x: 400, y: 300, vx: 1000, vy: 0 };
  stepParticle(p, [], 4000, 0, 0, 1 / 60);
  assert.ok(Math.hypot(p.vx, p.vy) <= V_MAX + 1e-9);
});

console.log(`  （${passed} 项通过）`);
