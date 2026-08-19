/**
 * Morphing crystalline mesh for "time illusion" lab.
 * Subdivided octahedron + radial displacement → glass-like emergent forms.
 */

export type Vec3 = { x: number; y: number; z: number };

export type CrystalMesh = {
  vertices: Vec3[];
  faces: [number, number, number][];
};

export function normalize(v: Vec3): Vec3 {
  const L = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / L, y: v.y / L, z: v.z / L };
}

function midpoint(a: Vec3, b: Vec3): Vec3 {
  return normalize({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  });
}

export function buildCrystalMesh(subdivisions = 2): CrystalMesh {
  const vertices: Vec3[] = [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 },
  ].map(normalize);

  let faces: [number, number, number][] = [
    [0, 2, 4],
    [2, 1, 4],
    [1, 3, 4],
    [3, 0, 4],
    [2, 0, 5],
    [1, 2, 5],
    [3, 1, 5],
    [0, 3, 5],
  ];

  for (let s = 0; s < subdivisions; s++) {
    const cache = new Map<string, number>();
    const mid = (i: number, j: number) => {
      const key = i < j ? `${i}_${j}` : `${j}_${i}`;
      let idx = cache.get(key);
      if (idx !== undefined) return idx;
      idx = vertices.length;
      vertices.push(midpoint(vertices[i], vertices[j]));
      cache.set(key, idx);
      return idx;
    };
    const next: [number, number, number][] = [];
    for (const [a, b, c] of faces) {
      const ab = mid(a, b);
      const bc = mid(b, c);
      const ca = mid(c, a);
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = next;
  }

  return { vertices, faces };
}

export function displaceVertex(v: Vec3, t: number, amount: number): Vec3 {
  const n1 =
    Math.sin(v.x * 3.1 + t * 0.7) *
    Math.cos(v.y * 2.7 - t * 0.5) *
    Math.sin(v.z * 3.4 + t * 0.3);
  const n2 =
    Math.sin(v.x * 5.2 - t * 0.9) *
    Math.sin(v.y * 4.8 + t * 0.6) *
    Math.cos(v.z * 5.5 - t * 0.4);
  const n3 = Math.sin((v.x + v.y + v.z) * 2.2 + t * 1.1);
  const pulse = 0.55 + 0.45 * Math.sin(t * 0.35);
  const r = 1 + amount * pulse * (0.55 * n1 + 0.3 * n2 + 0.15 * n3);
  return { x: v.x * r, y: v.y * r, z: v.z * r };
}

export function rotateY(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}

export function rotateX(v: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}

export function project(
  v: Vec3,
  width: number,
  height: number,
  scale: number,
): { x: number; y: number; z: number } {
  const fov = 2.55;
  const z = v.z + fov;
  const k = scale / z;
  return {
    x: width / 2 + v.x * k,
    y: height * 0.58 + v.y * k * 0.95,
    z: v.z,
  };
}

export function faceNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const ux = b.x - a.x;
  const uy = b.y - a.y;
  const uz = b.z - a.z;
  const vx = c.x - a.x;
  const vy = c.y - a.y;
  const vz = c.z - a.z;
  return normalize({
    x: uy * vz - uz * vy,
    y: uz * vx - ux * vz,
    z: ux * vy - uy * vx,
  });
}
