/**
 * Particle Life — minimal emergent-life simulation.
 * Rules: typed particles attract/repel within a radius; friction damps velocity.
 * Inspired by hunar4321/particle-life (educational, not a port of their code).
 */

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: number;
};

export type LifeParams = {
  /** Force scale */
  g: number;
  /** Interaction radius (px) */
  radius: number;
  /** Velocity damping per frame (0..1 keep) */
  friction: number;
  /** Max speed clamp */
  maxSpeed: number;
};

export const TYPE_COLORS = [
  "#67e8f9", // cyan
  "#f9a8d4", // pink
  "#86efac", // green
  "#fcd34d", // amber
  "#c4b5fd", // violet
  "#fb923c", // orange
] as const;

export function createMatrix(types: number, seed?: number): number[][] {
  // Deterministic-ish if seed given
  let s = seed ?? Date.now() % 1_000_000;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  const m: number[][] = [];
  for (let i = 0; i < types; i++) {
    m[i] = [];
    for (let j = 0; j < types; j++) {
      // Bias slightly toward mild attraction for more "life-like" clumps
      m[i][j] = rand() * 2 - 0.85;
    }
  }
  return m;
}

export function scatterParticles(
  width: number,
  height: number,
  count: number,
  types: number,
): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      type: i % types,
    });
  }
  return out;
}

/**
 * One simulation step. Mutates particles in place.
 * O(n²) — fine for a few hundred particles on modern devices.
 */
export function stepLife(
  particles: Particle[],
  matrix: number[][],
  width: number,
  height: number,
  params: LifeParams,
): void {
  const { g, radius, friction, maxSpeed } = params;
  const r2 = radius * radius;
  const n = particles.length;

  for (let i = 0; i < n; i++) {
    const a = particles[i];
    let fx = 0;
    let fy = 0;

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const b = particles[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;

      // Toroidal wrap: shortest delta
      if (dx > width / 2) dx -= width;
      else if (dx < -width / 2) dx += width;
      if (dy > height / 2) dy -= height;
      else if (dy < -height / 2) dy += height;

      const d2 = dx * dx + dy * dy;
      if (d2 < 0.0001 || d2 > r2) continue;

      const dist = Math.sqrt(d2);
      // Peak force near mid-radius; soft near 0 to reduce collapse
      const t = dist / radius;
      const shape = t < 0.5 ? t * 2 : 2 - t * 2;
      const force = matrix[a.type][b.type] * shape * g;
      fx += (dx / dist) * force;
      fy += (dy / dist) * force;
    }

    a.vx = (a.vx + fx) * friction;
    a.vy = (a.vy + fy) * friction;

    const sp = Math.hypot(a.vx, a.vy);
    if (sp > maxSpeed) {
      a.vx = (a.vx / sp) * maxSpeed;
      a.vy = (a.vy / sp) * maxSpeed;
    }

    a.x += a.vx;
    a.y += a.vy;

    if (a.x < 0) a.x += width;
    else if (a.x >= width) a.x -= width;
    if (a.y < 0) a.y += height;
    else if (a.y >= height) a.y -= height;
  }
}
