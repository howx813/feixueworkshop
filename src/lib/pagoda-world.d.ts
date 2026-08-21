/** Type declarations for the procedural voxel pagoda garden. */

export type VoxelBlock = { x: number; y: number; z: number; c: number };

export function mulberry32(seed: number): () => number;

export function generateGarden(seed?: number): {
  blocks: VoxelBlock[];
  meta: {
    seed: number;
    count: number;
    baseY: number;
    bounds: {
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
      maxY: number;
    };
  };
};

export const PALETTE: string[];
