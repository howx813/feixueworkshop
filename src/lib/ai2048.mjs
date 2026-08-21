/**
 * Expectimax AI for 2048.
 *
 * Max layer  = AI picks one of 4 moves.
 * Chance layer = game spawns a 2 (p=0.9) or 4 (p=0.1) in each empty cell.
 *
 * Heuristic (classic weights, cf. nneonneo's 2048-AI):
 *   - empty cells      (more breathing room = better)
 *   - monotonicity     (rows/cols ordered → snake chain building)
 *   - smoothness       (adjacent log-values close → mergeable)
 *   - max tile in corner bonus
 *
 * Depth adapts: fewer empty cells → search deeper.
 */
import { move, emptyCells } from "./game2048.mjs";

const W_EMPTY = 270;
const W_MONO = 47;
const W_SMOOTH = 3;
const W_CORNER = 120;

function log2(v) {
  return v > 0 ? Math.log2(v) : 0;
}

function evaluate(board) {
  let empty = 0;
  let smooth = 0;
  let maxVal = 0;
  let maxIdx = 0;

  for (let i = 0; i < 16; i++) {
    if (board[i] === 0) empty++;
    else if (board[i] > maxVal) {
      maxVal = board[i];
      maxIdx = i;
    }
  }

  // smoothness: penalize big log-diffs between orthogonal neighbors
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = board[r * 4 + c];
      if (v === 0) continue;
      if (c < 3 && board[r * 4 + c + 1] !== 0) {
        smooth -= Math.abs(log2(v) - log2(board[r * 4 + c + 1]));
      }
      if (r < 3 && board[(r + 1) * 4 + c] !== 0) {
        smooth -= Math.abs(log2(v) - log2(board[(r + 1) * 4 + c]));
      }
    }
  }

  // monotonicity: prefer rows/cols that increase toward one side
  let monoLeftRight = 0;
  let monoUpDown = 0;
  for (let r = 0; r < 4; r++) {
    let row = [board[r * 4], board[r * 4 + 1], board[r * 4 + 2], board[r * 4 + 3]];
    for (let c = 0; c < 3; c++) {
      const a = log2(row[c] || 1);
      const b = log2(row[c + 1] || 1);
      if (a > b) monoLeftRight += b - a;
      else monoUpDown += a - b;
    }
  }
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 3; r++) {
      const a = log2(board[r * 4 + c] || 1);
      const b = log2(board[(r + 1) * 4 + c] || 1);
      if (a > b) monoUpDown += b - a;
      else monoLeftRight += a - b;
    }
  }
  const mono = Math.max(monoLeftRight, monoUpDown);

  // corner bonus: max tile sitting in any corner
  const corners = [board[0], board[3], board[12], board[15]];
  const cornerBonus = corners.includes(maxVal) ? log2(maxVal) : 0;

  return (
    empty * W_EMPTY +
    mono * W_MONO +
    smooth * W_SMOOTH +
    cornerBonus * W_CORNER
  );
}

function searchMax(board, depth) {
  let best = -Infinity;
  for (let dir = 0; dir < 4; dir++) {
    const { board: next, moved } = move(board, dir);
    if (!moved) continue;
    const v = searchChance(next, depth);
    if (v > best) best = v;
  }
  return best === -Infinity ? evaluate(board) - 10000 : best; // dead end penalty
}

function searchChance(board, depth) {
  if (depth <= 0) return evaluate(board);
  const cells = emptyCells(board);
  if (cells.length === 0) return evaluate(board);

  // cap branching: sample at most 4 spawn cells (uniform over empties)
  const step = Math.max(1, Math.floor(cells.length / 4));
  let total = 0;
  let weight = 0;
  for (let i = 0; i < cells.length; i += step) {
    for (const [val, p] of [
      [2, 0.9],
      [4, 0.1],
    ]) {
      board[cells[i]] = val;
      total += p * searchMax(board, depth - 1);
      weight += p;
      board[cells[i]] = 0;
    }
  }
  return weight > 0 ? total / weight : evaluate(board);
}

/**
 * Best direction for the current board, or -1 when no move is possible.
 * depth = number of max layers to search (default 2, auto-extends on tight boards).
 */
export function bestMove(board, depth = 2) {
  const empties = emptyCells(board).length;
  const d = empties <= 4 ? depth + 2 : empties <= 8 ? depth + 1 : depth;
  let bestDir = -1;
  let bestScore = -Infinity;
  for (let dir = 0; dir < 4; dir++) {
    const { board: next, moved } = move(board, dir);
    if (!moved) continue;
    const v = searchChance(next, d);
    if (v > bestScore) {
      bestScore = v;
      bestDir = dir;
    }
  }
  return bestDir;
}
