/**
 * 碎砖弹珠纯逻辑（可单测，不依赖 DOM）
 */

export const MARBLE_W = 480;
export const MARBLE_H = 640;
export const BRICK_ROWS = 6;
export const BRICK_COLS = 10;
export const BRICK_GAP = 4;

export type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  alive: boolean;
};

export type DropKind = "multi" | "wide" | "sticky" | "slow" | "fire" | "life";

export const DROP_KINDS: DropKind[] = [
  "multi",
  "wide",
  "sticky",
  "slow",
  "fire",
  "life",
];

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function makeBricks(
  w = MARBLE_W,
  rows = BRICK_ROWS,
  cols = BRICK_COLS,
): Brick[] {
  const marginX = 16;
  const top = 72;
  const totalGap = BRICK_GAP * (cols - 1);
  const bw = (w - marginX * 2 - totalGap) / cols;
  const bh = 16;
  const list: Brick[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hp = r < 2 ? 3 : r < 4 ? 2 : 1;
      list.push({
        x: marginX + c * (bw + BRICK_GAP),
        y: top + r * (bh + BRICK_GAP),
        w: bw,
        h: bh,
        hp,
        maxHp: hp,
        alive: true,
      });
    }
  }
  return list;
}

export function circleHitsRect(
  cx: number,
  cy: number,
  r: number,
  b: Pick<Brick, "x" | "y" | "w" | "h">,
): boolean {
  const nx = clamp(cx, b.x, b.x + b.w);
  const ny = clamp(cy, b.y, b.y + b.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

export function hitBrick(
  brick: Brick,
  fire: boolean,
): { destroyed: boolean; scoreGain: number } {
  if (!brick.alive) return { destroyed: false, scoreGain: 0 };
  if (fire) {
    brick.hp = 0;
  } else {
    brick.hp -= 1;
  }
  if (brick.hp <= 0) {
    brick.alive = false;
    return { destroyed: true, scoreGain: 10 * brick.maxHp };
  }
  return { destroyed: false, scoreGain: 2 };
}

export function applyWide(paddleW: number, delta = 28, max = 160) {
  return Math.min(max, paddleW + delta);
}

export function allBricksCleared(bricks: Brick[]) {
  return bricks.length > 0 && bricks.every((b) => !b.alive);
}
