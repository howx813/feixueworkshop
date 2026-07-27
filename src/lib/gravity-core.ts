/**
 * 引力沙盘纯物理核心：无 DOM，可单测。
 * 方案 A 连续介质流：粒子处于持续风场中，质量点施加引力/斥力偏折。
 * 漂移速度模型：v_drift 积分引力加速度（带摩擦与上限），实际速度 = 风场 + 漂移。
 */

export type MassKind = "attract" | "repel";

export interface Mass {
  x: number;
  y: number;
  m: number;
  kind: MassKind;
}

export interface Particle {
  x: number;
  y: number;
  /** 漂移速度（风场之外、由引力积分的部分），px/s */
  vx: number;
  vy: number;
}

export const MAX_MASSES = 5;
export const SOFT = 12;
export const SOFT2 = SOFT * SOFT;
export const CORE_RADIUS = 6;
export const V_MAX = 420;
export const FRICTION = 0.995;

/** 风场速度：基础向右，叠加按 y 的正弦扰动 */
export function windAt(y: number, t: number, windSpeed: number) {
  return {
    wx: windSpeed,
    wy: windSpeed * 0.35 * Math.sin(y * 0.01 + t * 0.5),
  };
}

/** 合成引力加速度：a = sign·G·m·d⃗/r³，r² 用软化半径兜底防奇点 */
export function accelAt(x: number, y: number, masses: Mass[], G: number) {
  let ax = 0;
  let ay = 0;
  for (const mass of masses) {
    const dx = mass.x - x;
    const dy = mass.y - y;
    const r2 = Math.max(dx * dx + dy * dy, SOFT2);
    const inv = 1 / (r2 * Math.sqrt(r2));
    const sign = mass.kind === "attract" ? 1 : -1;
    const f = sign * G * mass.m * inv;
    ax += f * dx;
    ay += f * dy;
  }
  return { ax, ay };
}

/** 追加质点，超出上限 FIFO 淘汰最旧；返回新数组 */
export function addMass(masses: Mass[], mass: Mass): Mass[] {
  const next = [...masses, mass];
  return next.length > MAX_MASSES
    ? next.slice(next.length - MAX_MASSES)
    : next;
}

/** 粒子是否应重生：飞出任意边界，或被质点核心吞噬 */
export function shouldRespawn(
  p: Particle,
  width: number,
  height: number,
  masses: Mass[],
): boolean {
  if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) return true;
  for (const mass of masses) {
    const dx = mass.x - p.x;
    const dy = mass.y - p.y;
    if (dx * dx + dy * dy < CORE_RADIUS * CORE_RADIUS) return true;
  }
  return false;
}

/** 左缘随机高度重生 */
export function respawnParticle(height: number): Particle {
  return { x: 0, y: Math.random() * height, vx: 0, vy: 0 };
}

/** 全屏随机撒粒子（初始化 / 重置用） */
export function scatterParticles(
  width: number,
  height: number,
  n: number,
): Particle[] {
  const list: Particle[] = [];
  for (let i = 0; i < n; i++) {
    list.push({ x: Math.random() * width, y: Math.random() * height, vx: 0, vy: 0 });
  }
  return list;
}

/** 推进单个粒子一帧：漂移速度积分引力（摩擦+上限），位置按 风场+漂移 积分 */
export function stepParticle(
  p: Particle,
  masses: Mass[],
  G: number,
  windSpeed: number,
  t: number,
  dt: number,
): void {
  const w = windAt(p.y, t, windSpeed);
  const a = accelAt(p.x, p.y, masses, G);
  p.vx = (p.vx + a.ax * dt) * FRICTION;
  p.vy = (p.vy + a.ay * dt) * FRICTION;
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > V_MAX) {
    p.vx = (p.vx / sp) * V_MAX;
    p.vy = (p.vy / sp) * V_MAX;
  }
  p.x += (w.wx + p.vx) * dt;
  p.y += (w.wy + p.vy) * dt;
}
