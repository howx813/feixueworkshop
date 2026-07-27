/**
 * 碎砖弹珠纯逻辑（可单测，不依赖 DOM）
 */

export const MARBLE_W = 480;
export const MARBLE_H = 640;
export const BRICK_GAP = 6;

/** 签名墙每行砖数（与原梗图一致：6 行 × 8 + 末行 2 = 50） */
export const BRICK_ROW_COLS = [8, 8, 8, 8, 8, 8, 2];

/**
 * 黄仁勋「AI 开源签名」梗图里的 50 个签名方（按图中从左到右、从上到下）。
 * logo 图片裁自 Ben Burtenshaw 的可玩版视频（见 changelog 0.2.21）。
 */
export const SIGNER_COMPANIES: string[] = [
  // 第 1 行
  "AI21",
  "AMD",
  "American Innovators",
  "Amp",
  "Andreessen Horowitz",
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
  "Linux Foundation",
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
  "Ollama",
  "OpenAI",
  "OpenClaw",
  "Palantir",
  // 第 6 行
  "Palo Alto",
  "Periodic Labs",
  "Perplexity",
  "Prime Intellect",
  "Reflection",
  "Replit",
  "ServiceNow",
  "Telnyx",
  // 第 7 行
  "Trajectory",
  "Y Combinator",
];

/** 挡板：唯一没签名的那家 */
export const PADDLE_LABEL = "ANTHROPIC";
export const PADDLE_IMG = "/lab/marble/logos/anthropic.png";

export function brickImg(index: number) {
  return `/lab/marble/logos/${String(index).padStart(2, "0")}.png`;
}

export type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  label?: string;
  img?: string;
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
  rowCols: number[] = BRICK_ROW_COLS,
  labels: string[] = SIGNER_COMPANIES,
): Brick[] {
  const marginX = 16;
  const top = 64;
  const maxCols = Math.max(...rowCols);
  const totalGap = BRICK_GAP * (maxCols - 1);
  const bw = (w - marginX * 2 - totalGap) / maxCols;
  const bh = 26;
  const list: Brick[] = [];
  let i = 0;
  for (let r = 0; r < rowCols.length; r++) {
    for (let c = 0; c < rowCols[r]; c++) {
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
        img: brickImg(i),
      });
      i += 1;
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
