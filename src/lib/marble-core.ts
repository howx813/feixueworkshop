/**
 * 碎砖弹珠纯逻辑（可单测，不依赖 DOM）
 */

export const MARBLE_W = 480;
export const MARBLE_H = 640;
export const BRICK_ROWS = 6;
export const BRICK_COLS = 8;
export const BRICK_GAP = 4;

/**
 * 黄仁勋「AI 开源签名」梗图里的签名方（按图中从左到右、从上到下）。
 * 最后一块「You?」是留给还没签名的你的位置。
 */
export const SIGNER_COMPANIES: string[] = [
  // 第 1 行
  "AI21",
  "AMD",
  "Am. Innovators",
  "Amp",
  "a16z",
  "Arcee",
  "Arena",
  "Baseten",
  // 第 2 行
  "Black Forest Labs",
  "Block",
  "Box",
  "Cisco",
  "Cloudflare",
  "Cohere",
  "CrowdStrike",
  "Dell",
  // 第 3 行
  "DoorDash",
  "Emergence",
  "Fireworks AI",
  "Genspark",
  "GitHub",
  "Google",
  "Hugging Face",
  "IBM",
  // 第 4 行
  "inferact",
  "Interconnects",
  "Linux",
  "Mariana Minerals",
  "Meta",
  "Microsoft",
  "Mistral",
  "Morph",
  // 第 5 行
  "Mozilla",
  "Nebius",
  "Nous",
  "NVIDIA",
  "OpenAI",
  "OpenClaw",
  "Palantir",
  "Palo Alto",
  // 第 6 行
  "Periodic Labs",
  "Perplexity",
  "Replit",
  "ServiceNow",
  "Telnyx",
  "Trajectory",
  "Y Combinator",
  "You?",
];

/** 挡板：唯一没签名的那家 */
export const PADDLE_LABEL = "ANTHROPIC";

export type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  label?: string;
};

export type DropKind = "multi" | "wide" | "slow" | "fire" | "life";

export const DROP_KINDS: DropKind[] = [
  "multi",
  "wide",
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
  labels: string[] = SIGNER_COMPANIES,
): Brick[] {
  const marginX = 16;
  const top = 72;
  const totalGap = BRICK_GAP * (cols - 1);
  const bw = (w - marginX * 2 - totalGap) / cols;
  const bh = 16;
  const list: Brick[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const hp = r < 2 ? 3 : r < 4 ? 2 : 1;
      list.push({
        x: marginX + c * (bw + BRICK_GAP),
        y: top + r * (bh + BRICK_GAP),
        w: bw,
        h: bh,
        hp,
        maxHp: hp,
        alive: true,
        label: labels[i],
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
