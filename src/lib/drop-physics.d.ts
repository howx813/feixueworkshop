/** Type declarations for the text-drop physics engine. */

export interface DropBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  char: string;
  color: string;
  angle: number;
  va: number;
  sleeping: boolean;
  calmFrames: number;
}

export interface DropWorld {
  width: number;
  height: number;
  bodies: DropBody[];
  gravitySign: number;
  time: number;
  calmTime: number;
}

export function createWorld(width: number, height: number): DropWorld;
export function resizeWorld(world: DropWorld, width: number, height: number): void;
export function spawnBody(
  world: DropWorld,
  opts: { x: number; y: number; vx?: number; vy?: number; r?: number; char: string; color: string }
): DropBody;
export function step(world: DropWorld, dt: number): void;
export function pickBody(world: DropWorld, x: number, y: number): DropBody | null;
export function dragTo(body: DropBody, x: number, y: number, dt: number): void;
export function setGrabbed(body: DropBody | null): void;
