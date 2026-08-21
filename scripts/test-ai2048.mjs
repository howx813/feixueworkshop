/**
 * Unit tests for the 2048 engine + expectimax AI.
 * Run: node scripts/test-ai2048.mjs
 */
import { strict as assert } from "node:assert";
import {
  emptyBoard,
  move,
  spawn,
  isGameOver,
  maxTile,
  emptyCells,
} from "../src/lib/game2048.mjs";
import { bestMove } from "../src/lib/ai2048.mjs";

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

console.log("▸ 2048 engine");

test("move left merges a pair once", () => {
  // [2,2,4,0] left → [4,4,0,0], gained 4
  const b = [2, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const { board, gained, moved } = move(b, 3);
  assert.deepEqual(board.slice(0, 4), [4, 4, 0, 0]);
  assert.equal(gained, 4);
  assert.equal(moved, true);
});

test("move left does not double-merge", () => {
  // [2,2,2,2] left → [4,4,0,0] (one merge per tile), gained 8
  const b = [2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const { board, gained } = move(b, 3);
  assert.deepEqual(board.slice(0, 4), [4, 4, 0, 0]);
  assert.equal(gained, 8);
});

test("move right merges toward the right edge", () => {
  const b = [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const { board } = move(b, 1);
  assert.deepEqual(board.slice(0, 4), [0, 0, 0, 4]);
});

test("move up merges a column", () => {
  // col 0: [2,2,0,0] top→bottom, up → [4,0,0,0]
  const b = [2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const { board } = move(b, 0);
  assert.deepEqual([board[0], board[4], board[8], board[12]], [4, 0, 0, 0]);
});

test("move down merges a column", () => {
  const b = [2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const { board } = move(b, 2);
  assert.deepEqual([board[0], board[4], board[8], board[12]], [0, 0, 0, 4]);
});

test("no-move reports moved=false and keeps board", () => {
  const b = [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const { moved } = move(b, 1); // already at right? no — 2 at col0, right moves it
  assert.equal(moved, true);
  const full = [2, 4, 8, 16, 16, 8, 4, 2, 2, 4, 8, 16, 16, 8, 4, 2];
  const r2 = move(full, 0);
  assert.equal(r2.moved, false);
  assert.deepEqual(r2.board, full);
});

test("spawn fills exactly one empty cell with 2 or 4", () => {
  const b = emptyBoard();
  spawn(b);
  const nonZero = b.filter((v) => v !== 0);
  assert.equal(nonZero.length, 1);
  assert.ok([2, 4].includes(nonZero[0]));
});

test("isGameOver detects a dead board", () => {
  const dead = [2, 4, 8, 16, 16, 8, 4, 2, 2, 4, 8, 16, 16, 8, 4, 2];
  assert.equal(isGameOver(dead), true);
  const alive = [2, 4, 8, 16, 16, 8, 4, 2, 2, 4, 8, 16, 16, 8, 4, 0];
  assert.equal(isGameOver(alive), false);
  const mergeable = [2, 2, 4, 8, 8, 4, 2, 4, 4, 2, 4, 8, 16, 8, 4, 2];
  assert.equal(isGameOver(mergeable), false);
});

test("maxTile", () => {
  const b = [2, 4, 1024, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 512];
  assert.equal(maxTile(b), 1024);
});

console.log("▸ expectimax AI");

test("bestMove returns a legal direction on an opening board", () => {
  const b = emptyBoard();
  spawn(b);
  spawn(b);
  const dir = bestMove(b, 1);
  assert.ok(dir >= 0 && dir <= 3, `dir=${dir}`);
});

test("bestMove returns only movable directions", () => {
  // Snake-pattern board: most moves blocked, but several remain legal.
  const b = [4, 8, 2, 2, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2, 4];
  const movable = new Set([0, 1, 2, 3].filter((d) => move(b, d).moved));
  assert.ok(movable.size > 0);
  for (let trial = 0; trial < 5; trial++) {
    const dir = bestMove(b, 1);
    assert.ok(movable.has(dir), `AI picked ${dir}, legal set = ${[...movable]}`);
  }
});

test("AI plays a full game to 512+ without crashing (depth 1, seeded)", () => {
  let seed = 42;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const b = emptyBoard();
  spawn(b, rng);
  spawn(b, rng);
  let score = 0;
  let steps = 0;
  while (steps < 3000) {
    if (isGameOver(b)) break;
    const dir = bestMove(b, 1);
    assert.ok(dir >= 0, "AI should find a move before game over");
    const { board: next, gained, moved } = move(b, dir);
    assert.equal(moved, true);
    score += gained;
    spawn(next, rng);
    b.splice(0, 16, ...next);
    steps++;
  }
  assert.ok(maxTile(b) >= 512, `max tile only ${maxTile(b)} after ${steps} steps`);
  console.log(`    → seeded game: ${steps} steps, score ${score}, max tile ${maxTile(b)}, over=${isGameOver(b)}`);
});

test("AI reaches 2048 on a longer seeded run (depth 1)", () => {
  let seed = 7;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const b = emptyBoard();
  spawn(b, rng);
  spawn(b, rng);
  let steps = 0;
  while (steps < 8000) {
    if (isGameOver(b)) break;
    const dir = bestMove(b, 1);
    if (dir < 0) break;
    const { board: next } = move(b, dir);
    spawn(next, rng);
    b.splice(0, 16, ...next);
    steps++;
  }
  assert.ok(maxTile(b) >= 2048, `max tile only ${maxTile(b)} after ${steps} steps`);
  console.log(`    → seeded run 2: ${steps} steps, max tile ${maxTile(b)}, over=${isGameOver(b)}`);
});

console.log(`\n${passed} tests passed${process.exitCode === 1 ? " (WITH FAILURES)" : ""}`);
