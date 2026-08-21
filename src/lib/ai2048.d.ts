/** Type declarations for the 2048 expectimax AI. */

export type Dir = 0 | 1 | 2 | 3;
export type Board = number[];

export function bestMove(board: Board, depth?: number): Dir | -1;
