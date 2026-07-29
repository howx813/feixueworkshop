/**
 * 康威生命游戏核心（B3/S23）
 */

export type Board = {
  w: number;
  h: number;
  current: Uint8Array;
  next: Uint8Array;
};

export function createBoard(w: number, h: number): Board {
  return {
    w,
    h,
    current: new Uint8Array(w * h),
    next: new Uint8Array(w * h),
  };
}

export function clear(board: Board) {
  board.current.fill(0);
  board.next.fill(0);
}

export function randomize(board: Board, density = 0.2) {
  const { w, h } = board;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      board.current[y * w + x] = Math.random() < density ? 1 : 0;
    }
  }
}

export function toggleCell(board: Board, x: number, y: number) {
  if (x < 0 || x >= board.w || y < 0 || y >= board.h) return;
  const i = y * board.w + x;
  board.current[i] = board.current[i] ? 0 : 1;
}

export function step(board: Board) {
  const { w, h, current, next } = board;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            neighbors += current[ny * w + nx];
          }
        }
      }
      const alive = current[y * w + x];
      next[y * w + x] = alive
        ? neighbors === 2 || neighbors === 3 ? 1 : 0
        : neighbors === 3 ? 1 : 0;
    }
  }
  board.current.set(next);
}

export function placePattern(board: Board, pattern: number[][], offsetX = 0, offsetY = 0) {
  const { w, h } = board;
  const ph = pattern.length;
  const pw = pattern[0]?.length ?? 0;
  const ox = Math.floor((w - pw) / 2) + offsetX;
  const oy = Math.floor((h - ph) / 2) + offsetY;
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      const tx = ox + x;
      const ty = oy + y;
      if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
        board.current[ty * w + tx] = pattern[y][x];
      }
    }
  }
}

// 经典图案
export const GLIDER = [
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 1],
];

export const PULSAR = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
  [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
  [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
  [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
  [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
  [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
  [0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

export const GOSPER_GUN = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
