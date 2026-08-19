"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TYPE_COLORS,
  createMatrix,
  scatterParticles,
  stepLife,
  type LifeParams,
  type Particle,
} from "@/lib/particle-life-core";

const DEFAULT_TYPES = 5;
const DEFAULT_COUNT = 480;

export default function ParticleLife() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const matrixRef = useRef<number[][]>(createMatrix(DEFAULT_TYPES));
  const paramsRef = useRef<LifeParams>({
    g: 0.45,
    radius: 64,
    friction: 0.82,
    maxSpeed: 6,
  });
  const typesRef = useRef(DEFAULT_TYPES);
  const runningRef = useRef(true);
  const rafRef = useRef(0);

  const [running, setRunning] = useState(true);
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [types, setTypes] = useState(DEFAULT_TYPES);
  const [g, setG] = useState(0.45);
  const [radius, setRadius] = useState(64);
  const [seedNote, setSeedNote] = useState("规则已随机");

  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    paramsRef.current.g = g;
  }, [g]);
  useEffect(() => {
    paramsRef.current.radius = radius;
  }, [radius]);
  useEffect(() => {
    typesRef.current = types;
  }, [types]);

  const respawn = useCallback((n: number, t: number) => {
    const { width, height } = sizeRef.current;
    if (width <= 0 || height <= 0) return;
    particlesRef.current = scatterParticles(width, height, n, t);
  }, []);

  const randomizeRules = useCallback(() => {
    const t = typesRef.current;
    const seed = Date.now() % 1_000_000;
    matrixRef.current = createMatrix(t, seed);
    setSeedNote(`规则种子 ${seed}`);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let particleTarget = count;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      particleTarget = Math.min(count, 220);
      setCount(particleTarget);
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
      if (particlesRef.current.length === 0) {
        particlesRef.current = scatterParticles(
          width,
          height,
          particleTarget,
          typesRef.current,
        );
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const { width, height } = sizeRef.current;
      if (width <= 0 || height <= 0) return;

      if (runningRef.current) {
        stepLife(
          particlesRef.current,
          matrixRef.current,
          width,
          height,
          paramsRef.current,
        );
      }

      // Fade trail
      ctx.fillStyle = "rgba(10, 16, 24, 0.28)";
      ctx.fillRect(0, 0, width, height);

      const arr = particlesRef.current;
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        ctx.fillStyle = TYPE_COLORS[p.type % TYPE_COLORS.length];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Initial clear
    ctx.fillStyle = "rgb(10, 16, 24)";
    ctx.fillRect(0, 0, sizeRef.current.width, sizeRef.current.height);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  // Types change → new rules + respawn
  useEffect(() => {
    matrixRef.current = createMatrix(types);
    respawn(count, types);
    setSeedNote("规则已随类型重置");
    // count intentionally omitted: type change uses latest count via closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types, respawn]);

  // Count change → keep rules, resize swarm
  useEffect(() => {
    const { width, height } = sizeRef.current;
    if (width <= 0 || height <= 0) return;
    const arr = particlesRef.current;
    const t = typesRef.current;
    while (arr.length > count) arr.pop();
    while (arr.length < count) {
      arr.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        type: arr.length % Math.max(1, t),
      });
    }
  }, [count]);

  return (
    <div>
      <div
        ref={containerRef}
        className="lab-canvas-wrap"
        style={{
          position: "relative",
          width: "100%",
          height: "min(62vh, 520px)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          overflow: "hidden",
          background: "rgb(10, 16, 24)",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: "100%", height: "100%" }}
          aria-label="粒子生命模拟画布"
        />
      </div>

      <div
        className="meta-row"
        style={{ marginTop: 12, flexWrap: "wrap", gap: 8 }}
      >
        <button
          type="button"
          className={`btn ${running ? "btn-ghost" : "btn-primary"}`}
          style={{ padding: "4px 12px", fontSize: "0.8125rem" }}
          onClick={() => setRunning((v) => !v)}
        >
          {running ? "暂停" : "继续"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: "4px 12px", fontSize: "0.8125rem" }}
          onClick={() => {
            randomizeRules();
            respawn(count, types);
          }}
        >
          随机规则
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: "4px 12px", fontSize: "0.8125rem" }}
          onClick={() => respawn(count, types)}
        >
          重新撒点
        </button>
        <span style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>
          {seedNote} · {count} 粒子 · {types} 色
        </span>
      </div>

      <div
        className="tender-keygrid"
        style={{ marginTop: 14 }}
        aria-label="参数"
      >
        <label className="tender-keycell">
          <span className="tender-keylabel">粒子数 {count}</span>
          <input
            type="range"
            min={120}
            max={900}
            step={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <label className="tender-keycell">
          <span className="tender-keylabel">颜色种类 {types}</span>
          <input
            type="range"
            min={3}
            max={6}
            step={1}
            value={types}
            onChange={(e) => setTypes(Number(e.target.value))}
          />
        </label>
        <label className="tender-keycell">
          <span className="tender-keylabel">力强度 {g.toFixed(2)}</span>
          <input
            type="range"
            min={0.1}
            max={1.2}
            step={0.05}
            value={g}
            onChange={(e) => setG(Number(e.target.value))}
          />
        </label>
        <label className="tender-keycell">
          <span className="tender-keylabel">感应半径 {radius}px</span>
          <input
            type="range"
            min={30}
            max={120}
            step={2}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
        </label>
      </div>

      <p
        className="item-body"
        style={{ marginTop: 12, fontSize: "0.8125rem", opacity: 0.85 }}
      >
        玩法：多色粒子按随机「谁吸引谁 / 谁排斥谁」互动。点「随机规则」直到出现丝状、团块或轨道——规则极简，图案会涌现。灵感来自 Particle Life
        一类演示，非商业移植。
      </p>
    </div>
  );
}
