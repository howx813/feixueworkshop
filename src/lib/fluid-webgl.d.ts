/**
 * Type declarations for the vendored WebGL fluid simulation
 * (adapted from PavelDoGreat/WebGL-Fluid-Simulation, MIT).
 */
export interface FluidHandle {
  destroy(): void;
  randomSplats(): void;
  setConfig(patch: Record<string, number | boolean>): void;
  isPaused(): boolean;
  togglePause(): boolean;
}

export function createFluidSimulation(
  canvas: HTMLCanvasElement,
  overrides?: Record<string, number | boolean>
): FluidHandle;
