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

/** 速度 → 颜色查找表（t 0..1 映射 32 档），避免每帧 hsl 字符串分配 */
const SPEED_COLORS = Array.from(
  { length: 32 },
  (_, i) => `hsl(${200 - (165 * i) / 31} 90% ${58 + (14 * i) / 31}%)`,
);

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
      if (e.button !== 0) return;
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
          const speed = dt > 0 ? Math.hypot(p.x - px, p.y - py) / dt : 0;
          const t = Math.min(Math.max((speed - 60) / 300, 0), 1);
          ctx.strokeStyle = SPEED_COLORS[(t * 31) | 0];
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
