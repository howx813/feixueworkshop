/** Type declarations for the 2048 game engine. */

export type Dir = 0 | 1 | 2 | 3;
export type Board = number[];

export function emptyBoard(): Board;
export function cloneBoard(board: Board): Board;
export function emptyCells(board: Board): number[];
export function move(
  board: Board,
  dir: Dir
): { board: Board; gained: number; moved: boolean };
export function spawn(board: Board, rng?: () => number): Board;
export function maxTile(board: Board): number;
export function isGameOver(board: Board): boolean;
export function hasWon(board: Board): boolean;
export const SIZE: number;
