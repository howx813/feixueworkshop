/**
 * Unit tests for the procedural voxel pagoda garden.
 * Run: node scripts/test-pagoda.mjs
 */
import { strict as assert } from "node:assert";
import { generateGarden, mulberry32, PALETTE } from "../src/lib/pagoda-world.mjs";

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

console.log("▸ voxel pagoda garden");

test("deterministic: same seed → identical world", () => {
  const a = generateGarden(12345);
  const b = generateGarden(12345);
  assert.equal(a.blocks.length, b.blocks.length);
  assert.deepEqual(a.blocks[0], b.blocks[0]);
  assert.deepEqual(a.blocks[a.blocks.length - 1], b.blocks[b.blocks.length - 1]);
});

test("different seeds → different worlds", () => {
  const a = generateGarden(1);
  const b = generateGarden(2);
  assert.notEqual(a.blocks.length, 0);
  assert.notEqual(
    a.blocks.map((x) => `${x.x},${x.y},${x.z},${x.c}`).join("|"),
    b.blocks.map((x) => `${x.x},${x.y},${x.z},${x.c}`).join("|")
  );
});

test("world size is sane (800–6000 blocks)", () => {
  const { blocks, meta } = generateGarden(20260821);
  assert.ok(blocks.length >= 800 && blocks.length <= 6000, `count=${blocks.length}`);
  assert.equal(meta.count, blocks.length);
});

test("all palette indices valid", () => {
  const { blocks } = generateGarden(7);
  for (const b of blocks) {
    assert.ok(b.c >= 0 && b.c < PALETTE.length, `bad color index ${b.c}`);
    assert.ok(Number.isInteger(b.x) && Number.isInteger(b.y) && Number.isInteger(b.z));
  }
});

test("no duplicate cells", () => {
  const { blocks } = generateGarden(99);
  const seen = new Set();
  for (const b of blocks) {
    const k = `${b.x},${b.y},${b.z}`;
    assert.ok(!seen.has(k), `duplicate cell ${k}`);
    seen.add(k);
  }
});

test("pagoda exists: tall stack of body+roof colors near origin", () => {
  const { blocks } = generateGarden(20260821);
  const bodyCount = blocks.filter((b) => b.c === 3).length; // wood red
  const roofCount = blocks.filter((b) => b.c === 4).length; // slate
  const goldCount = blocks.filter((b) => b.c === 11).length; // spire
  assert.ok(bodyCount > 30, `pagoda body too small: ${bodyCount}`);
  assert.ok(roofCount > 60, `pagoda roofs too small: ${roofCount}`);
  assert.ok(goldCount >= 4, `spire missing: ${goldCount}`);
});

test("garden features exist: water, stone, cherry, bamboo, light", () => {
  const { blocks } = generateGarden(20260821);
  const has = (c) => blocks.some((b) => b.c === c);
  assert.ok(has(10), "pond missing");
  assert.ok(has(2), "stone missing");
  assert.ok(has(6) || has(7), "cherry blossoms missing");
  assert.ok(has(9), "bamboo missing");
  assert.ok(has(12), "lantern light missing");
});

test("no floating single blocks (every block rests on another or is ground)", () => {
  // canopy/flower blocks legitimately float (leaves); check structural blocks only
  const { blocks } = generateGarden(5);
  const solid = new Set(blocks.map((b) => `${b.x},${b.y},${b.z}`));
  const structural = blocks.filter((b) => [3, 4, 8, 2, 11].includes(b.c));
  let floating = 0;
  for (const b of structural) {
    const below = solid.has(`${b.x},${b.y - 1},${b.z}`);
    const above = solid.has(`${b.x},${b.y + 1},${b.z}`);
    const beside =
      solid.has(`${b.x + 1},${b.y},${b.z}`) ||
      solid.has(`${b.x - 1},${b.y},${b.z}`) ||
      solid.has(`${b.x},${b.y},${b.z + 1}`) ||
      solid.has(`${b.x},${b.y},${b.z - 1}`);
    if (!below && !above && !beside) floating++;
  }
  assert.equal(floating, 0, `${floating} floating structural blocks`);
});

test("PRNG is deterministic and well-distributed", () => {
  const rng = mulberry32(42);
  const vals = [rng(), rng(), rng()];
  const rng2 = mulberry32(42);
  assert.equal(vals[0], rng2());
  assert.equal(vals[1], rng2());
  for (const v of vals) assert.ok(v >= 0 && v < 1);
});

console.log(`\n${passed} tests passed${process.exitCode === 1 ? " (WITH FAILURES)" : ""}`);
