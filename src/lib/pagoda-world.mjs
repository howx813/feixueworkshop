/**
 * Procedural voxel pagoda garden.
 * Pure generation — seed in, block list out. No assets, no DOM.
 *
 * Block: { x, y, z, c } where c indexes the PALETTE.
 * World is a floating garden island: terrain, a 5-story pagoda,
 * cherry trees, stone lanterns, a pond and a stone path.
 */

export const PALETTE = [
  "#5a8f4a", // 0 grass top
  "#6e5238", // 1 dirt
  "#9aa3ab", // 2 stone (path, lantern)
  "#b5473c", // 3 pagoda body (wood red)
  "#3d4450", // 4 pagoda roof (slate)
  "#d8d3c8", // 5 roof trim (paper white)
  "#e8b4c8", // 6 cherry blossom
  "#d98ba8", // 7 cherry blossom deep
  "#6b4a35", // 8 trunk
  "#7fae6a", // 9 bamboo
  "#4a7fa5", // 10 pond
  "#d4a942", // 11 pagoda spire (gold)
  "#f0c860", // 12 lantern light
];

/** Deterministic PRNG (mulberry32). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simple value noise on a coarse grid, bilinear-interpolated. */
function makeNoise(rng, size) {
  const grid = [];
  for (let i = 0; i < size * size; i++) grid.push(rng());
  return (x, y) => {
    const gx = ((x % size) + size) % size;
    const gy = ((y % size) + size) % size;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const x1 = (x0 + 1) % size;
    const y1 = (y0 + 1) % size;
    const fx = gx - x0;
    const fy = gy - y0;
    const v00 = grid[y0 * size + x0];
    const v10 = grid[y0 * size + x1];
    const v01 = grid[y1 * size + x0];
    const v11 = grid[y1 * size + x1];
    return (
      v00 * (1 - fx) * (1 - fy) +
      v10 * fx * (1 - fy) +
      v01 * (1 - fx) * fy +
      v11 * fx * fy
    );
  };
}

/**
 * Generate the garden. Returns { blocks, meta }.
 * blocks: array of {x,y,z,c} — integer voxel coords, y = up.
 */
export function generateGarden(seed = 20260821) {
  const rng = mulberry32(seed);
  const noise = makeNoise(rng, 8);
  /** @type {Map<string, number>} */
  const map = new Map();
  const key = (x, y, z) => `${x},${y},${z}`;
  const put = (x, y, z, c) => map.set(key(x, y, z), c);
  const at = (x, y, z) => map.get(key(x, y, z));

  const R = 13; // island radius
  const GROUND = 0;

  // ---- terrain: radial island with noise relief ----
  const heights = new Map(); // "x,z" -> ground level
  for (let x = -R; x <= R; x++) {
    for (let z = -R; z <= R; z++) {
      const d = Math.hypot(x, z);
      if (d > R) continue;
      const edge = Math.max(0, d / R);
      const h = Math.round(2 + noise(x * 0.55, z * 0.55) * 2.2 * (1 - edge * 0.7) - edge * 1.4);
      heights.set(`${x},${z}`, h);
      // top block + 1-2 dirt below
      put(x, h, z, 0);
      put(x, h - 1, z, 1);
      if (h <= GROUND) put(x, h - 2, z, 1);
    }
  }
  const groundAt = (x, z) => {
    const h = heights.get(`${x},${z}`);
    return h === undefined ? null : h;
  };

  // ---- pond: a dip southeast of center ----
  const pondCX = 6;
  const pondCZ = 5;
  for (let x = pondCX - 4; x <= pondCX + 4; x++) {
    for (let z = pondCZ - 3; z <= pondCZ + 3; z++) {
      const d = Math.hypot((x - pondCX) / 4, (z - pondCZ) / 3);
      if (d > 1) continue;
      const g = groundAt(x, z);
      if (g === null) continue;
      put(x, g, z, 10); // water fills the dip
      for (let y = g + 1; y <= g + 2; y++) map.delete(key(x, y, z));
    }
  }

  // ---- stone path: from pagoda base toward the pond ----
  for (let t = 0; t <= 10; t++) {
    const x = Math.round(t * (pondCX / 10) * 0.7);
    const z = Math.round(3 + t * ((pondCZ - 3) / 10) * 0.7);
    const g = groundAt(x, z);
    if (g === null) continue;
    if (at(x, g, z) === 10) continue;
    put(x, g, z, 2);
  }

  // ---- pagoda: 5 stories, centered ----
  const stories = 5;
  let y = Math.max(...[...heights.values()]) + 1;
  const baseY = y;
  // stone foundation 5x5
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      put(dx, y, dz, 2);
    }
  }
  y += 1;
  let half = 3; // roof half-width per story (shrinks)
  for (let s = 0; s < stories; s++) {
    const bodyHalf = 1; // 3x3 body
    const bodyH = 2;
    // body
    for (let dy = 0; dy < bodyH; dy++) {
      for (let dx = -bodyHalf; dx <= bodyHalf; dx++) {
        for (let dz = -bodyHalf; dz <= bodyHalf; dz++) {
          // hollow interior
          const isShell =
            Math.abs(dx) === bodyHalf ||
            Math.abs(dz) === bodyHalf ||
            dy === 0;
          if (isShell) put(dx, y + dy, dz, 3);
        }
      }
    }
    y += bodyH;
    // paper trim under the roof
    for (let dx = -bodyHalf - 1; dx <= bodyHalf + 1; dx++) {
      for (let dz = -bodyHalf - 1; dz <= bodyHalf + 1; dz++) {
        if (Math.abs(dx) === bodyHalf + 1 || Math.abs(dz) === bodyHalf + 1) {
          put(dx, y, dz, 5);
        }
      }
    }
    // roof: wide slab, corners droop
    for (let dx = -half; dx <= half; dx++) {
      for (let dz = -half; dz <= half; dz++) {
        put(dx, y + 1, dz, 4);
      }
    }
    // droop corners
    for (const [cx, cz] of [
      [-half, -half],
      [half, -half],
      [-half, half],
      [half, half],
    ]) {
      put(cx, y, cz, 4);
    }
    y += 2;
    half = Math.max(2, half - 1);
  }
  // spire
  for (let dy = 0; dy < 3; dy++) put(0, y + dy, 0, 11);
  put(0, y + 3, 0, 11);

  // ---- cherry trees ----
  const treeSpots = [
    [-8, -6],
    [-9, 4],
    [7, -7],
    [4, 9],
    [-4, 9],
  ];
  for (const [tx, tz] of treeSpots) {
    const g = groundAt(tx, tz);
    if (g === null) continue;
    if (at(tx, g, tz) === 10) continue; // not in pond
    const trunkH = 2 + Math.floor(rng() * 2);
    for (let dy = 1; dy <= trunkH; dy++) put(tx, g + dy, tz, 8);
    // canopy: rounded blob
    const cy = g + trunkH + 1;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 0; dy <= 2; dy++) {
          const d = Math.hypot(dx / 2.2, dz / 2.2, (dy - 0.8) / 1.4);
          if (d > 1) continue;
          if (rng() < 0.12) continue; // organic gaps
          put(tx + dx, cy + dy, tz + dz, rng() < 0.3 ? 7 : 6);
        }
      }
    }
  }

  // ---- bamboo clusters ----
  const bambooSpots = [
    [-11, 0],
    [10, 1],
    [0, -10],
  ];
  for (const [bx, bz] of bambooSpots) {
    for (let i = 0; i < 3; i++) {
      const x = bx + Math.floor(rng() * 3) - 1;
      const z = bz + Math.floor(rng() * 3) - 1;
      const g = groundAt(x, z);
      if (g === null) continue;
      const h = 3 + Math.floor(rng() * 2);
      for (let dy = 1; dy <= h; dy++) put(x, g + dy, z, 9);
    }
  }

  // ---- stone lanterns ----
  const lanternSpots = [
    [-4, -4],
    [5, -3],
    [-2, 6],
  ];
  for (const [lx, lz] of lanternSpots) {
    const g = groundAt(lx, lz);
    if (g === null) continue;
    put(lx, g + 1, lz, 2);
    put(lx, g + 2, lz, 2);
    put(lx, g + 3, lz, 12); // warm light
    put(lx, g + 4, lz, 2); // cap
  }

  // ---- flower sprinkles ----
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rng() * (R * 2 - 2)) - R + 1;
    const z = Math.floor(rng() * (R * 2 - 2)) - R + 1;
    const g = groundAt(x, z);
    if (g === null) continue;
    if (at(x, g, z) !== 0) continue;
    put(x, g + 1, z, rng() < 0.5 ? 6 : 7);
  }

  // ---- flatten to array ----
  const blocks = [];
  for (const [k, c] of map) {
    const [x, y2, z] = k.split(",").map(Number);
    blocks.push({ x, y: y2, z, c });
  }

  return {
    blocks,
    meta: {
      seed,
      count: blocks.length,
      baseY,
      bounds: {
        minX: -R,
        maxX: R,
        minZ: -R,
        maxZ: R,
        maxY: baseY + stories * 4 + 6,
      },
    },
  };
}
