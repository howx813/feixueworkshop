/**
 * 2048 game engine — pure functions, no DOM.
 * Board is a flat array of 16 tile values (0 = empty), row-major:
 * index = row * 4 + col. Row 0 is the top row.
 */

export const SIZE = 4;

export function emptyBoard() {
  return new Array(16).fill(0);
}

export function cloneBoard(board) {
  return board.slice();
}

export function emptyCells(board) {
  const cells = [];
  for (let i = 0; i < 16; i++) if (board[i] === 0) cells.push(i);
  return cells;
}

/**
 * Slide + merge a single 4-length line to the left.
 * Returns { line, gained, moved }.
 */
function collapseLine(line) {
  const tiles = line.filter((v) => v !== 0);
  const out = [0, 0, 0, 0];
  let gained = 0;
  let pos = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      out[pos] = tiles[i] * 2;
      gained += out[pos];
      i++; // merged pair consumes both
    } else {
      out[pos] = tiles[i];
    }
    pos++;
  }
  let moved = false;
  for (let i = 0; i < 4; i++) {
    if (line[i] !== out[i]) moved = true;
  }
  return { line: out, gained, moved };
}

/** Extract one line in "leftward" order for a given direction. */
function extractLine(board, dir, k) {
  const line = new Array(4);
  for (let j = 0; j < 4; j++) {
    if (dir === 3) line[j] = board[k * 4 + j]; // left: row k
    else if (dir === 1) line[j] = board[k * 4 + (3 - j)]; // right: reversed row
    else if (dir === 0) line[j] = board[j * 4 + k]; // up: column k top->bottom
    else line[j] = board[(3 - j) * 4 + k]; // down: column k bottom->top
  }
  return line;
}

function writeLine(board, dir, k, line) {
  for (let j = 0; j < 4; j++) {
    if (dir === 3) board[k * 4 + j] = line[j];
    else if (dir === 1) board[k * 4 + (3 - j)] = line[j];
    else if (dir === 0) board[j * 4 + k] = line[j];
    else board[(3 - j) * 4 + k] = line[j];
  }
}

/**
 * Apply a move. Returns { board (new), gained, moved }.
 * Does NOT spawn a new tile.
 */
export function move(board, dir) {
  const next = cloneBoard(board);
  let gained = 0;
  let moved = false;
  for (let k = 0; k < 4; k++) {
    const { line, gained: g, moved: m } = collapseLine(extractLine(board, dir, k));
    writeLine(next, dir, k, line);
    gained += g;
    moved = moved || m;
  }
  return { board: next, gained, moved };
}

/**
 * Spawn a random tile (90% → 2, 10% → 4) into a uniformly chosen empty cell.
 * Mutates and returns the board. rng defaults to Math.random.
 */
export function spawn(board, rng = Math.random) {
  const cells = emptyCells(board);
  if (cells.length === 0) return board;
  const idx = cells[Math.floor(rng() * cells.length)];
  board[idx] = rng() < 0.9 ? 2 : 4;
  return board;
}

export function maxTile(board) {
  return Math.max(...board);
}

/**
 * Game over when no empty cell AND no adjacent equal pair in any row/column.
 */
export function isGameOver(board) {
  if (emptyCells(board).length > 0) return false;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = board[r * 4 + c];
      if (c < 3 && board[r * 4 + c + 1] === v) return false;
      if (r < 3 && board[(r + 1) * 4 + c] === v) return false;
    }
  }
  return true;
}

/** Standard scoring starts at 0; every merge adds the merged value. */
export function hasWon(board) {
  return maxTile(board) >= 2048;
}
