/**
 * Unit tests for the text-drop physics engine.
 * Run: node scripts/test-text-drop.mjs
 */
import { strict as assert } from "node:assert";
import {
  createWorld,
  spawnBody,
  step,
  pickBody,
  dragTo,
} from "../src/lib/drop-physics.mjs";

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (e) {
    console.error(`  ✘ ${name}`);
    console.error(e.message);
    process.exitCode = 1;
  }
}

const DT = 1 / 60;

console.log("▸ text-drop physics");

test("free fall: body accelerates downward and lands", () => {
  const w = createWorld(400, 400);
  spawnBody(w, { x: 200, y: 50, char: "字", color: "#fff" });
  let frames = 0;
  while (frames++ < 600) {
    step(w, DT);
    if (w.bodies[0].sleeping) break;
  }
  const b = w.bodies[0];
  assert.ok(b.sleeping, "body should settle");
  assert.ok(b.y > 330, `landed too high: y=${b.y}`);
});

test("floor bounce loses energy (restitution < 1)", () => {
  const w = createWorld(400, 600);
  spawnBody(w, { x: 200, y: 60, char: "落", color: "#fff" });
  // track local maxima of y (bounce peaks). First peak after falling,
  // second peak must be lower — energy was lost.
  const peaks = [];
  let prevY = 60;
  let dir = 1; // 1 falling, -1 rising
  for (let f = 0; f < 400 && peaks.length < 2; f++) {
    step(w, DT);
    const y = w.bodies[0].y;
    const d = y - prevY;
    if (dir === 1 && d < 0) {
      peaks.push(prevY); // touched bottom, starts rising
      dir = -1;
    } else if (dir === -1 && d > 0) {
      peaks.push(prevY); // bounce apex, starts falling
      dir = 1;
    }
    prevY = y;
  }
  assert.ok(peaks.length >= 2, `only ${peaks.length} peaks captured`);
  // peaks[0] = floor contact level (~577), peaks[1] = bounce apex (y downward).
  // Drop was from y=60 (517px fall); with REST=0.32 the bounce should reach
  // only ~10% of that height — apex must stay well below the drop start.
  assert.ok(peaks[1] > 400, `bounce apex ${peaks[1].toFixed(0)} too low, no visible bounce`);
  assert.ok(peaks[1] > 300 + 100, `no energy loss? apex=${peaks[1].toFixed(0)}`);
});

test("two bodies stack or separate without overlap", () => {
  const w = createWorld(300, 420);
  spawnBody(w, { x: 150, y: 340, char: "一", color: "#fff" });
  for (let f = 0; f < 240; f++) step(w, DT); // settle first
  spawnBody(w, { x: 152, y: 120, char: "钧", color: "#fff" });
  let frames = 0;
  while (frames++ < 900) {
    step(w, DT);
    const [a, b] = w.bodies;
    if (a.sleeping && b.sleeping) break;
  }
  const [a, b] = w.bodies;
  assert.ok(a.sleeping && b.sleeping, "both should settle");
  // legal outcomes: stacked vertically OR pushed side by side on the floor —
  // what matters is they are not interpenetrating and both inside bounds
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  assert.ok(
    dist >= (a.r + b.r) * 0.8,
    `bodies interpenetrating: dist=${dist.toFixed(1)} < ${(a.r + b.r) * 0.8}`
  );
});

test("horizontal wall keeps bodies inside", () => {
  const w = createWorld(300, 400);
  spawnBody(w, { x: 20, y: 100, vx: -500, char: "出", color: "#fff" });
  for (let f = 0; f < 60; f++) step(w, DT);
  const b = w.bodies[0];
  assert.ok(b.x >= b.r - 0.5, `escaped left wall: x=${b.x}`);
  assert.ok(b.vx > 0 || b.sleeping, "wall should reverse velocity");
});

test("pickBody finds nearest under pointer", () => {
  const w = createWorld(400, 400);
  spawnBody(w, { x: 100, y: 100, char: "甲", color: "#fff" });
  spawnBody(w, { x: 300, y: 300, char: "乙", color: "#fff" });
  const hit = pickBody(w, 105, 103);
  assert.equal(hit.char, "甲");
  assert.equal(pickBody(w, 390, 390), null);
});

test("dragTo moves body and imparts throw velocity", () => {
  const w = createWorld(400, 400);
  const b = spawnBody(w, { x: 100, y: 100, char: "抛", color: "#fff" });
  dragTo(b, 140, 100, DT);
  assert.equal(b.x, 140);
  assert.ok(Math.abs(b.vx) > 500, `throw velocity too small: ${b.vx}`);
  assert.equal(b.sleeping, false);
});

test("gravity flip makes bodies rise to the ceiling", () => {
  const w = createWorld(300, 400);
  const b = spawnBody(w, { x: 150, y: 350, char: "反", color: "#fff" });
  w.gravitySign = -1;
  for (let f = 0; f < 480 && !b.sleeping; f++) step(w, DT);
  assert.ok(b.y < 80, `body should float up, y=${b.y}`);
  assert.ok(b.sleeping, "should settle on ceiling");
});

test("pile of 30 chars settles within 8s simulated", () => {
  const w = createWorld(360, 520);
  let t = 0;
  let spawned = 0;
  const DTs = 1 / 60;
  while (t < 8 && spawned < 30) {
    // spawn one every ~90ms, scattered like the real typing UI
    if ((t * 1000) % 90 < DTs * 1000 && spawned < 30) {
      spawnBody(w, {
        x: 24 + ((spawned * 53) % 310),
        y: 30,
        vx: (Math.random() - 0.5) * 60,
        char: "字落如雨一字千钧"[spawned % 8],
        color: "#fff",
      });
      spawned++;
    }
    step(w, DTs);
    t += DTs;
  }
  for (let f = 0; f < 480; f++) step(w, DTs);
  let asleep = 0;
  for (const b of w.bodies) if (b.sleeping) asleep++;
  assert.ok(asleep >= 24, `only ${asleep}/${w.bodies.length} settled`);
});

test("all bodies stay inside bounds through chaos", () => {
  const w = createWorld(300, 400);
  for (let i = 0; i < 12; i++) {
    spawnBody(w, {
      x: 30 + i * 20,
      y: 40 + (i % 3) * 30,
      vx: (Math.random() - 0.5) * 800,
      vy: (Math.random() - 0.5) * 400,
      char: "压",
      color: "#fff",
    });
  }
  for (let f = 0; f < 600; f++) {
    step(w, DT);
    for (const b of w.bodies) {
      assert.ok(b.x >= b.r - 1 && b.x <= w.width - b.r + 1, `x out: ${b.x}`);
      assert.ok(b.y <= w.height - 6, `y below floor: ${b.y}`);
    }
  }
});

console.log(`\n${passed} tests passed${process.exitCode === 1 ? " (WITH FAILURES)" : ""}`);
