/**
 * Koch snowflake（科赫雪花）— 六角版
 *
 * 递归规则（对每条线段 AB）：
 * 1. 三等分，得点 P1、P2
 * 2. 以 P1 为顶点，将 P1P2 向外旋转 60° 得到尖点 Peak
 * 3. 用折线 A → P1 → Peak → P2 → B 替换 AB
 *
 * 初始形：默认等边三角形（sides=3，经典 Koch / 品牌标候选 C）
 * 也可传 sides=6 做六角版。
 */

export type Point = { x: number; y: number };

const DEG60 = Math.PI / 3;

/** 将点 p 绕 origin 旋转 60°（sign: 1 逆时针 / -1 顺时针） */
export function rotate60(p: Point, origin: Point, sign: 1 | -1 = 1): Point {
  const c = Math.cos(sign * DEG60);
  const s = Math.sin(sign * DEG60);
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  return {
    x: origin.x + dx * c - dy * s,
    y: origin.y + dx * s + dy * c,
  };
}

/** 对单段做 Koch 替换；返回以 B 结尾的点列（不含起点 A） */
export function kochRefine(
  a: Point,
  b: Point,
  depth: number,
  sign: 1 | -1,
): Point[] {
  if (depth <= 0) return [b];

  const p1: Point = {
    x: a.x + (b.x - a.x) / 3,
    y: a.y + (b.y - a.y) / 3,
  };
  const p2: Point = {
    x: a.x + (2 * (b.x - a.x)) / 3,
    y: a.y + (2 * (b.y - a.y)) / 3,
  };
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

/**
 * 正 n 边形顶点（逆时针）
 * @param sides 边数，雪花默认 6
 * @param startAngle 第一个顶点极角，默认 -π/2（尖朝上）
 */
export function regularPolygon(
  sides: number,
  cx: number,
  cy: number,
  r: number,
  startAngle = -Math.PI / 2,
): Point[] {
  const n = Math.max(3, Math.floor(sides));
  return Array.from({ length: n }, (_, i) => {
    const a = startAngle + (i * 2 * Math.PI) / n;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

/** 等边三角形（经典 Koch 基底，sides=3） */
export function equilateralTriangle(cx: number, cy: number, r: number): Point[] {
  return regularPolygon(3, cx, cy, r);
}

/** 正六边形（本站默认 Koch 基底，6 个角度） */
export function regularHexagon(cx: number, cy: number, r: number): Point[] {
  return regularPolygon(6, cx, cy, r);
}

export type KochSnowflakeOptions = {
  depth: number;
  cx?: number;
  cy?: number;
  radius?: number;
  /** 边数，默认 3（经典三角）；六角版传 6 */
  sides?: number;
  /**
   * 尖角朝外方向。顶点按逆时针排列时，-1 为向外（默认）。
   */
  outward?: 1 | -1;
};

/**
 * 生成科赫雪花全部顶点（闭合折线）
 * 默认：等边三角形 + Koch 迭代（经典版）
 */
export function kochSnowflakePoints(options: KochSnowflakeOptions): Point[];
export function kochSnowflakePoints(
  depth: number,
  cx?: number,
  cy?: number,
  radius?: number,
  outward?: 1 | -1,
): Point[];
export function kochSnowflakePoints(
  depthOrOpts: number | KochSnowflakeOptions,
  cx = 0,
  cy = 0,
  radius = 1,
  outward: 1 | -1 = -1,
): Point[] {
  const opts: Required<KochSnowflakeOptions> =
    typeof depthOrOpts === "number"
      ? {
          depth: depthOrOpts,
          cx,
          cy,
          radius,
          sides: 3,
          outward,
        }
      : {
          depth: depthOrOpts.depth,
          cx: depthOrOpts.cx ?? 0,
          cy: depthOrOpts.cy ?? 0,
          radius: depthOrOpts.radius ?? 1,
          sides: depthOrOpts.sides ?? 3,
          outward: depthOrOpts.outward ?? -1,
        };

  const verts = regularPolygon(opts.sides, opts.cx, opts.cy, opts.radius);
  const ring: Point[] = [verts[0]];
  for (let i = 0; i < verts.length; i++) {
    const p = verts[i];
    const q = verts[(i + 1) % verts.length];
    ring.push(...kochRefine(p, q, opts.depth, opts.outward));
  }
  return ring;
}

/** 点列 → SVG path `d`（闭合） */
export function pointsToPath(points: Point[], closed = true): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`;
  for (const p of rest) {
    d += ` L ${p.x.toFixed(3)} ${p.y.toFixed(3)}`;
  }
  if (closed) d += " Z";
  return d;
}

export function kochSnowflakePath(
  depth: number,
  cx = 50,
  cy = 50,
  radius = 40,
  sides = 3,
): string {
  return pointsToPath(
    kochSnowflakePoints({
      depth,
      cx,
      cy,
      radius,
      sides,
      outward: -1,
    }),
  );
}

/**
 * 六重对称「晶体雪花」：径向分支（L-system 风格）
 * 不是 Koch 边界，而是从中心 6 个方向长枝
 */
export function crystalSnowflakeSegments(
  depth: number,
  cx = 50,
  cy = 50,
  length = 36,
): Array<[Point, Point]> {
  const segs: Array<[Point, Point]> = [];

  function branch(x: number, y: number, angle: number, len: number, d: number) {
    const x2 = x + len * Math.cos(angle);
    const y2 = y + len * Math.sin(angle);
    segs.push([
      { x, y },
      { x: x2, y: y2 },
    ]);
    if (d <= 0) return;
    const next = len * 0.38;
    branch(x2, y2, angle - Math.PI / 3, next, d - 1);
    branch(x2, y2, angle + Math.PI / 3, next, d - 1);
    branch(x2, y2, angle, next * 1.05, d - 1);
  }

  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    branch(cx, cy, a, length, depth);
  }
  return segs;
}
