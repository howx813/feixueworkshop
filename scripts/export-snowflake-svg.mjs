/**
 * 导出六角科赫雪花 SVG
 * 用法: node scripts/export-snowflake-svg.mjs [depth=3] [sides=6]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const depth = Math.max(0, Math.min(6, Number(process.argv[2] ?? 3)));
const sides = Math.max(3, Math.min(12, Number(process.argv[3] ?? 6)));

const DEG60 = Math.PI / 3;

function rotate60(p, origin, sign = -1) {
  const c = Math.cos(sign * DEG60);
  const s = Math.sin(sign * DEG60);
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  return {
    x: origin.x + dx * c - dy * s,
    y: origin.y + dx * s + dy * c,
  };
}

function kochRefine(a, b, depth, sign) {
  if (depth <= 0) return [b];
  const p1 = { x: a.x + (b.x - a.x) / 3, y: a.y + (b.y - a.y) / 3 };
  const p2 = { x: a.x + (2 * (b.x - a.x)) / 3, y: a.y + (2 * (b.y - a.y)) / 3 };
  const peak = rotate60(p2, p1, sign);
  return [
    ...kochRefine(a, p1, depth - 1, sign).slice(0, -1),
    p1,
    ...kochRefine(p1, peak, depth - 1, sign).slice(0, -1),
    peak,
    ...kochRefine(peak, p2, depth - 1, sign).slice(0, -1),
    p2,
    ...kochRefine(p2, b, depth - 1, sign),
  ];
}

function polygon(n, cx, cy, r) {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

function snowflakePath(depth, sides) {
  const verts = polygon(sides, 50, 50, 36);
  const ring = [verts[0]];
  for (let i = 0; i < verts.length; i++) {
    const p = verts[i];
    const q = verts[(i + 1) % verts.length];
    ring.push(...kochRefine(p, q, depth, -1));
  }
  const [f, ...rest] = ring;
  let d = `M ${f.x.toFixed(3)} ${f.y.toFixed(3)}`;
  for (const p of rest) d += ` L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`;
  return d + " Z";
}

const d = snowflakePath(depth, sides);
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="128" height="128">
  <!-- Koch snowflake, sides=${sides}, depth=${depth} -->
  <rect width="100" height="100" rx="22" fill="#10151c"/>
  <path d="${d}" fill="none" stroke="#6cb8c6" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>
</svg>
`;

const out = path.join(
  root,
  "public",
  "brand",
  `koch-snowflake-s${sides}-d${depth}.svg`,
);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg);
// also write default name for logo use
fs.writeFileSync(path.join(root, "public", "brand", "koch-snowflake.svg"), svg);
console.log(`wrote ${path.relative(root, out)} and koch-snowflake.svg (sides=${sides}, depth=${depth})`);
