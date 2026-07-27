# 引力沙盘 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 手搓宝匣新增「引力沙盘」（/lab/gravity/）：粒子风横穿 Canvas，鼠标放置的质量点像引力透镜一样掰弯流线，作为 v0.2.17 上线。

**Architecture:** 方案 A 连续介质流（spec: `docs/superpowers/specs/2026-07-27-gravity-sandbox-design.md`）。纯物理核心 `gravity-core.ts` 无 DOM 可单测；`GravitySandbox.tsx` 自包含 Canvas 组件，rAF 循环只读 ref，控件 state 单向同步进 ref。

**Tech Stack:** Next.js 14 App Router（静态导出）、TypeScript、Canvas 2D、项目自带 mjs 单测范式。

**对 spec 的两处实现细化（有意为之，不算偏差）：**

1. spec 公式 `v += a·dt` 中 wind 是速度量纲，直接当加速度会爆速。实现为**漂移速度模型**：漂移速度 `v_drift` 积分引力加速度并带轻摩擦（×0.995/帧）+ 上限 420px/s；实际速度 = 风场速度 + 漂移速度。静止粒子即随风走，行为与 spec 描述一致。
2. spec 测试 1「质点右侧的粒子加速度 x 分量 > 0」符号写反了：粒子在吸引质点右侧，受力朝左，`ax < 0`。计划按正确物理断言。

---

### Task 1: 物理核心 gravity-core.ts

**Files:**
- Create: `src/lib/gravity-core.ts`

- [ ] **Step 1: 创建文件，内容如下**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/gravity-core.ts
git commit -m "feat(lab): 引力沙盘物理核心 gravity-core"
```

### Task 2: 物理核心单测

**Files:**
- Create: `scripts/test-gravity.mjs`
- Modify: `package.json`（`test:unit` 串联）

- [ ] **Step 1: 创建 `scripts/test-gravity.mjs`**

遵循项目惯例（test-marble.mjs）：内联精简版逻辑，避免 ts 编译依赖，规则与 gravity-core.ts 保持一致。

```js
/**
 * 引力沙盘物理核心单测（不启动浏览器）
 * 内联精简版逻辑，与 src/lib/gravity-core.ts 规则保持一致
 */
import assert from "node:assert/strict";

const MAX_MASSES = 5;
const SOFT = 12;
const SOFT2 = SOFT * SOFT;
const CORE_RADIUS = 6;
const V_MAX = 420;
const FRICTION = 0.995;

function windAt(y, t, windSpeed) {
  return {
    wx: windSpeed,
    wy: windSpeed * 0.35 * Math.sin(y * 0.01 + t * 0.5),
  };
}

function accelAt(x, y, masses, G) {
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

function addMass(masses, mass) {
  const next = [...masses, mass];
  return next.length > MAX_MASSES
    ? next.slice(next.length - MAX_MASSES)
    : next;
}

function shouldRespawn(p, width, height, masses) {
  if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) return true;
  for (const mass of masses) {
    const dx = mass.x - p.x;
    const dy = mass.y - p.y;
    if (dx * dx + dy * dy < CORE_RADIUS * CORE_RADIUS) return true;
  }
  return false;
}

function respawnParticle(height) {
  return { x: 0, y: Math.random() * height, vx: 0, vy: 0 };
}

function stepParticle(p, masses, G, windSpeed, t, dt) {
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

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passed += 1;
  } catch (e) {
    console.error(`  ✖ ${name}`);
    console.error("   ", e.message || e);
    process.exitCode = 1;
  }
}

console.log("\n▸ 引力沙盘物理核心单测");

const attractor = { x: 100, y: 100, m: 1, kind: "attract" };
const repulsor = { x: 100, y: 100, m: 1, kind: "repel" };

test("吸引：质点右侧粒子的加速度朝左（ax < 0）", () => {
  const a = accelAt(200, 100, [attractor], 4000);
  assert.ok(a.ax < 0);
  assert.ok(Math.abs(a.ay) < 1e-9);
});

test("软化半径：粒子与质点重合时加速度有界、不发散", () => {
  const a = accelAt(100, 100, [attractor], 4000);
  assert.ok(Number.isFinite(a.ax));
  assert.ok(Number.isFinite(a.ay));
  // 极近距（1px）也不超过软化后的上界 G·m/SOFT²
  const near = accelAt(101, 100, [attractor], 4000);
  assert.ok(Math.hypot(near.ax, near.ay) <= (4000 * 1) / SOFT2 + 1e-9);
});

test("排斥：质点右侧粒子的加速度朝右（ax > 0）", () => {
  const a = accelAt(200, 100, [repulsor], 4000);
  assert.ok(a.ax > 0);
});

test("FIFO：放第 6 个质点淘汰最旧", () => {
  let masses = [];
  for (let i = 0; i < 6; i++) {
    masses = addMass(masses, { x: i * 10, y: 0, m: 1, kind: "attract" });
  }
  assert.equal(masses.length, 5);
  assert.equal(masses[0].x, 10); // x=0 的已被淘汰
  assert.equal(masses[4].x, 50);
});

test("重生判定：左/右/上/下越界都应重生", () => {
  const no = [];
  assert.ok(shouldRespawn({ x: -5, y: 50, vx: 0, vy: 0 }, 800, 600, no));
  assert.ok(shouldRespawn({ x: 805, y: 50, vx: 0, vy: 0 }, 800, 600, no));
  assert.ok(shouldRespawn({ x: 50, y: -5, vx: 0, vy: 0 }, 800, 600, no));
  assert.ok(shouldRespawn({ x: 50, y: 605, vx: 0, vy: 0 }, 800, 600, no));
  assert.ok(!shouldRespawn({ x: 50, y: 50, vx: 0, vy: 0 }, 800, 600, no));
});

test("重生判定：进入质点核心半径被吞噬", () => {
  assert.ok(
    shouldRespawn({ x: 103, y: 100, vx: 0, vy: 0 }, 800, 600, [attractor]),
  );
});

test("左缘重生：x=0、y 在界内、漂移速度归零", () => {
  for (let i = 0; i < 50; i++) {
    const p = respawnParticle(600);
    assert.equal(p.x, 0);
    assert.ok(p.y >= 0 && p.y <= 600);
    assert.equal(p.vx, 0);
    assert.equal(p.vy, 0);
  }
});

test("风场：wx 等于风速，|wy| 不超过 0.35 倍风速", () => {
  for (let t = 0; t < 10; t += 0.5) {
    const w = windAt(123.4, t, 60);
    assert.equal(w.wx, 60);
    assert.ok(Math.abs(w.wy) <= 60 * 0.35 + 1e-9);
  }
});

test("摩擦：无引力时漂移速度逐帧衰减", () => {
  const p = { x: 400, y: 300, vx: 100, vy: 0 };
  stepParticle(p, [], 4000, 0, 0, 1 / 60);
  assert.ok(p.vx < 100);
  assert.ok(p.vx > 0);
});
```

- [ ] **Step 2: `package.json` 的 `test:unit` 改为**

```json
"test:unit": "node scripts/test-marble.mjs && node scripts/test-aihot.mjs && node scripts/test-gravity.mjs",
```

- [ ] **Step 3: 跑单测**

Run: `npm run test:unit`
Expected: 全部 ✔，退出码 0，含「▸ 引力沙盘物理核心单测」9 条通过

- [ ] **Step 4: Commit**

```bash
git add scripts/test-gravity.mjs package.json
git commit -m "test(lab): 引力沙盘物理核心单测"
```

### Task 3: 宝匣清单条目与图标

**Files:**
- Modify: `src/components/LabIcon.tsx`（`LabIconKey` 联合类型 + `gravity` case）
- Modify: `src/data/lab.ts`（`LabItem["icon"]` 联合类型 + 清单顶部条目）

- [ ] **Step 1: `src/components/LabIcon.tsx`**

`LabIconKey` 改为：

```ts
export type LabIconKey =
  | "gravity"
  | "fluid"
  | "particles"
  | "graphic"
  | "marble"
  | "snowflake";
```

`switch` 顶部（`case "fluid"` 之前）插入：

```tsx
    case "gravity":
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
          <ellipse cx="12" cy="12" rx="9" ry="4.2" />
          <circle cx="19.6" cy="9.4" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
```

- [ ] **Step 2: `src/data/lab.ts`**

`LabItem["icon"]` 类型改为：

```ts
  /** 应用名称前的 SVG 图标标识 */
  icon: "gravity" | "fluid" | "particles" | "graphic" | "marble" | "snowflake";
```

`labItems` 数组顶部插入：

```ts
  {
    id: "gravity",
    title: "引力沙盘",
    icon: "gravity",
    summary:
      "一道粒子风横穿屏幕，放下的质量点像引力透镜一样把流线掰弯；可切排斥。",
    href: "/lab/gravity/",
    status: "可玩",
    tags: ["Canvas", "物理模拟", "引力"],
    updated: "2026-07-27",
  },
```

- [ ] **Step 3: Commit**

```bash
git add src/components/LabIcon.tsx src/data/lab.ts
git commit -m "feat(lab): 宝匣清单加引力沙盘条目与图标"
```

### Task 4: Canvas 组件与样式

**Files:**
- Modify: `src/app/globals.css`（「流体实验室」样式段之前插入引力沙盘样式段）
- Create: `src/components/GravitySandbox.tsx`

- [ ] **Step 1: `src/app/globals.css` 在 `/* 流体实验室 */` 注释行之前插入**

```css
/* 引力沙盘 */
.gravity-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.gravity-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.gravity-modes {
  display: flex;
  gap: 6px;
}

.gravity-mode-on {
  border-color: var(--accent) !important;
  color: var(--accent) !important;
}

.gravity-slider {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--text-2);
  white-space: nowrap;
}

.gravity-slider input[type="range"] {
  width: 110px;
  accent-color: var(--accent);
}

.gravity-lab {
  position: relative;
  width: 100%;
  height: 520px;
  background: var(--bg-0);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  overflow: hidden;
}

.gravity-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}

.gravity-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-2);
  text-align: center;
}

@media (max-width: 640px) {
  .gravity-lab {
    height: 420px;
  }
}
```

- [ ] **Step 2: 创建 `src/components/GravitySandbox.tsx`**

```tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CORE_RADIUS,
  addMass,
  respawnParticle,
  scatterParticles,
  shouldRespawn,
  stepParticle,
  type Mass,
  type MassKind,
  type Particle,
} from "@/lib/gravity-core";

const HIT_RADIUS = 14;

const KIND_COLOR: Record<MassKind, string> = {
  attract: "#7dd3fc",
  repel: "#fb923c",
};

type Params = { g: number; wind: number; count: number };

export default function GravitySandbox() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const massesRef = useRef<Mass[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const paramsRef = useRef<Params>({ g: 4000, wind: 60, count: 3000 });
  const modeRef = useRef<MassKind>("attract");
  const dragRef = useRef(-1);
  const timeRef = useRef(0);
  const lastTsRef = useRef(0);
  const rafRef = useRef(0);

  const [mode, setMode] = useState<MassKind>("attract");
  const [g, setG] = useState(4000);
  const [wind, setWind] = useState(60);
  const [count, setCount] = useState(3000);

  // 控件 state → ref 单向同步（rAF 循环只读 ref，避免闭包过期）
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    paramsRef.current.g = g;
  }, [g]);
  useEffect(() => {
    paramsRef.current.wind = wind;
  }, [wind]);
  useEffect(() => {
    paramsRef.current.count = count;
    const { width, height } = sizeRef.current;
    if (width <= 0 || height <= 0) return;
    const arr = particlesRef.current;
    while (arr.length > count) arr.pop();
    while (arr.length < count) arr.push(respawnParticle(height));
  }, [count]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(1500);
    }

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width, height };
      for (const m of massesRef.current) {
        m.x = Math.min(Math.max(m.x, 0), width);
        m.y = Math.min(Math.max(m.y, 0), height);
      }
      if (particlesRef.current.length === 0) {
        particlesRef.current = scatterParticles(
          width,
          height,
          paramsRef.current.count,
        );
      }
      // 尺寸变化后清屏，避免拖尾残影错位
      ctx.fillStyle = "rgb(10, 16, 24)";
      ctx.fillRect(0, 0, width, height);
    };

    const posFromEvent = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const hitIndex = (x: number, y: number) =>
      massesRef.current.findIndex(
        (m) => (m.x - x) ** 2 + (m.y - y) ** 2 <= HIT_RADIUS * HIT_RADIUS,
      );

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture?.(e.pointerId);
      const { x, y } = posFromEvent(e);
      const idx = hitIndex(x, y);
      if (idx >= 0) {
        dragRef.current = idx;
      } else {
        massesRef.current = addMass(massesRef.current, {
          x,
          y,
          m: 1,
          kind: modeRef.current,
        });
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragRef.current < 0) return;
      const { x, y } = posFromEvent(e);
      const m = massesRef.current[dragRef.current];
      if (!m) {
        dragRef.current = -1;
        return;
      }
      m.x = Math.min(Math.max(x, 0), sizeRef.current.width);
      m.y = Math.min(Math.max(y, 0), sizeRef.current.height);
    };

    const onPointerUp = () => {
      dragRef.current = -1;
    };

    const onDblClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const idx = hitIndex(e.clientX - rect.left, e.clientY - rect.top);
      if (idx >= 0) massesRef.current.splice(idx, 1);
    };

    const animate = (ts: number) => {
      const { width, height } = sizeRef.current;
      if (width > 0 && height > 0) {
        const dt =
          lastTsRef.current === 0
            ? 1 / 60
            : Math.min((ts - lastTsRef.current) / 1000, 0.05);
        lastTsRef.current = ts;
        timeRef.current += dt;

        // 拖尾：半透明覆盖
        ctx.fillStyle = "rgba(10, 16, 24, 0.12)";
        ctx.fillRect(0, 0, width, height);

        const masses = massesRef.current;
        const params = paramsRef.current;

        ctx.lineWidth = 1.2;
        for (const p of particlesRef.current) {
          const px = p.x;
          const py = p.y;
          stepParticle(p, masses, params.g, params.wind, timeRef.current, dt);
          if (shouldRespawn(p, width, height, masses)) {
            Object.assign(p, respawnParticle(height));
            continue;
          }
          // 按本帧实际速率变色：慢=青蓝 → 快=暖白（引力加速形成“透镜亮弧”）
          const speed = Math.hypot(p.x - px, p.y - py) / dt;
          const t = Math.min(Math.max((speed - 60) / 300, 0), 1);
          ctx.strokeStyle = `hsl(${200 - 165 * t} 90% ${58 + 14 * t}%)`;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }

        for (const m of masses) {
          const color = KIND_COLOR[m.kind];
          const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 18);
          grad.addColorStop(0, color);
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(m.x, m.y, CORE_RADIUS + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    updateSize();
    rafRef.current = requestAnimationFrame(animate);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("dblclick", onDblClick);
    window.addEventListener("resize", updateSize);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateSize);
      ro.observe(container);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("dblclick", onDblClick);
      window.removeEventListener("resize", updateSize);
      ro?.disconnect();
    };
  }, []);

  return (
    <div className="gravity-wrap">
      <div className="gravity-controls">
        <div className="gravity-modes">
          <button
            type="button"
            className={`btn btn-ghost${mode === "attract" ? " gravity-mode-on" : ""}`}
            onClick={() => setMode("attract")}
          >
            吸引
          </button>
          <button
            type="button"
            className={`btn btn-ghost${mode === "repel" ? " gravity-mode-on" : ""}`}
            onClick={() => setMode("repel")}
          >
            排斥
          </button>
        </div>
        <label className="gravity-slider">
          引力
          <input
            type="range"
            min={0}
            max={12000}
            step={100}
            value={g}
            onChange={(e) => setG(Number(e.target.value))}
          />
        </label>
        <label className="gravity-slider">
          风速
          <input
            type="range"
            min={0}
            max={200}
            step={5}
            value={wind}
            onChange={(e) => setWind(Number(e.target.value))}
          />
        </label>
        <label className="gravity-slider">
          粒子
          <input
            type="range"
            min={500}
            max={4000}
            step={100}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            massesRef.current = [];
          }}
        >
          清空
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            massesRef.current = [];
            const { width, height } = sizeRef.current;
            if (width > 0 && height > 0) {
              particlesRef.current = scatterParticles(
                width,
                height,
                paramsRef.current.count,
              );
            }
          }}
        >
          重置
        </button>
      </div>
      <div className="gravity-lab" ref={containerRef}>
        <canvas ref={canvasRef} className="gravity-canvas" />
      </div>
      <p className="gravity-hint">
        点击空白放质点 · 拖动移动 · 双击删除 · 粒子越亮越快 · 最多 5 个质点
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Lint**

Run: `npm run lint:ci`
Expected: 0 errors 0 warnings

- [ ] **Step 4: Commit**

```bash
git add src/components/GravitySandbox.tsx src/app/globals.css
git commit -m "feat(lab): 引力沙盘 Canvas 组件与样式"
```

### Task 5: 页面与预检清单

**Files:**
- Create: `src/app/lab/gravity/page.tsx`
- Modify: `scripts/predeploy-check.mjs:30`（fluid 行之后插入 gravity 行）

- [ ] **Step 1: 创建 `src/app/lab/gravity/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import GravitySandbox from "@/components/GravitySandbox";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "引力沙盘",
  description: `${site.name}${labMeta.name} · 引力透镜式粒子流交互演示。`,
};

export default function GravityPage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}引力模拟
      </p>
      <h1 className="page-title">引力沙盘</h1>
      <p className="page-desc">
        一道粒子风横穿屏幕。点击放下的质量点像引力透镜一样把流线掰弯；吸引或排斥，由你切换。
      </p>

      <GravitySandbox />

      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `scripts/predeploy-check.mjs` 在 fluid 行之后插入**

```js
  { file: "lab/gravity/index.html", mustInclude: ["引力沙盘"] },
```

- [ ] **Step 3: Commit**

```bash
git add src/app/lab/gravity/page.tsx scripts/predeploy-check.mjs
git commit -m "feat(lab): 引力沙盘页面与预检清单"
```

### Task 6: changelog v0.2.17 + 全量预检

**Files:**
- Modify: `src/data/changelog.ts`（数组顶部插入）

- [ ] **Step 1: `src/data/changelog.ts` 在 `version: "0.2.16"` 条目之前插入**

```ts
  {
    version: "0.2.17",
    date: "2026-07-27",
    title: "引力沙盘",
    summary:
      "手搓宝匣新增引力沙盘：粒子风横穿屏幕，质量点如引力透镜掰弯流线，支持吸引/排斥双模式与参数滑杆。",
    items: [
      { tag: "新增", text: "/lab/gravity 引力沙盘：放质点弯曲粒子流" },
      { tag: "新增", text: "吸引/排斥双模式、引力/风速/粒子数滑杆" },
      { tag: "新增", text: "gravity-core 纯物理核心与单测" },
    ],
  },
```

- [ ] **Step 2: 确认版本号**

Run: `npm run version:print`
Expected: 输出 `0.2.17`

- [ ] **Step 3: 全量预检**

Run: `npm run test:predeploy`
Expected: 7/7 全过，静态页清单含 `lab/gravity/index.html` ✔，结尾「预检全部通过」

- [ ] **Step 4: Commit**

```bash
git add src/data/changelog.ts
git commit -m "release: v0.2.17 引力沙盘"
```

### Task 7: 推送 + 部署 + 线上验证

- [ ] **Step 1: 推送**

Run: `git push`
Expected: main 更新到 origin

- [ ] **Step 2: 部署**

Run: `npm run deploy`
Expected: 预检过 → 备份 → 上传成功 → 「已创建 tag v0.2.17」「已推送 v0.2.17 → origin」→「部署完成」

- [ ] **Step 3: 同步 package.json 版本提交（deploy 的 release-tag 会改 version 字段）**

Run: `git add package.json && git commit -m "chore: sync package.json version to 0.2.17" && git push`

- [ ] **Step 4: 线上验证**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://howx813-d7gx02spb2681185c-1456523152.tcloudbaseapp.com/lab/gravity/
curl -s https://howx813-d7gx02spb2681185c-1456523152.tcloudbaseapp.com/changelog/ | grep -c "0.2.17"
```
Expected: `200`；grep 计数 ≥ 1

---

## Self-Review 记录

- **Spec 覆盖**：质点上限/FIFO ✓（Task 1+2）、软化半径 ✓、任意边界重生 ✓、核心吞噬 ✓、滑杆三参数 ✓、吸引/排斥 ✓、清空/重置 ✓、双击删除 ✓、拖动 ✓、DPR ✓、reduced-motion ✓、resize 质点钳位 ✓、单测 5 项（实际 9 项）✓、预检清单 ✓、changelog/deploy ✓
- **占位符**：无
- **类型一致性**：`MassKind`/`Mass`/`Particle`/`addMass`/`accelAt`/`windAt`/`shouldRespawn`/`respawnParticle`/`scatterParticles`/`stepParticle`/`CORE_RADIUS` 在 Task 1 定义，Task 2 内联镜像、Task 4 导入，名称一致；CSS 类 `gravity-wrap/controls/modes/mode-on/slider/lab/canvas/hint` 在 Task 4 两处一致；`gravity` 图标 key 在 Task 3 三处一致
