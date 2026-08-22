"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  createWorld,
  resizeWorld,
  spawnBody,
  step,
  pickBody,
  dragTo,
  setGrabbed,
} from "@/lib/drop-physics";

const PALETTE = ["#e8eef5", "#7dd3fc", "#fbbf24", "#a7f3d0", "#f0abfc", "#fca5a5"];

function colorFor(ch: string): string {
  if (/[0-9]/.test(ch)) return PALETTE[2];
  if (/[a-zA-Z]/.test(ch)) return PALETTE[1];
  if (/[，。！？、；：""''（）]/.test(ch)) return "#8b93a1";
  return PALETTE[ch.charCodeAt(0) % 3 === 0 ? 0 : ch.charCodeAt(0) % 2 === 0 ? 4 : 3];
}

export default function TextDrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<ReturnType<typeof createWorld> | null>(null);
  const grabbedRef = useRef<ReturnType<typeof pickBody> | null>(null);
  const queueRef = useRef<{ chars: string[]; nextAt: number }>({ chars: [], nextAt: 0 });
  const [input, setInput] = useState("落霞与孤鹜齐飞，秋水共长天一色。The quick brown fox jumps over the lazy dog. 2026！");
  const [count, setCount] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.clientWidth || 800;
    const H = canvas.clientHeight || 520;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const world = createWorld(W, H);
    worldRef.current = world;

    // ---- pointer interaction: grab & throw ----
    let dragging = false;
    let lastT = performance.now();

    const pos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onDown = (e: PointerEvent) => {
      const p = pos(e);
      const b = pickBody(world, p.x, p.y);
      if (b) {
        dragging = true;
        grabbedRef.current = b;
        setGrabbed(b);
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging || !grabbedRef.current) return;
      const p = pos(e);
      const now = performance.now();
      const dt = Math.max((now - lastT) / 1000, 1 / 240);
      dragTo(grabbedRef.current, p.x, p.y, dt);
      lastT = now;
    };
    const onUp = () => {
      if (dragging) {
        dragging = false;
        setGrabbed(null);
        grabbedRef.current = null;
        canvas.style.cursor = "crosshair";
      }
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onUp);

    // ---- main loop (fixed timestep physics) ----
    let raf = 0;
    let acc = 0;
    let prev = performance.now();
    const DT = 1 / 120;

    const loop = (now: number) => {
      let frame = (now - prev) / 1000;
      prev = now;
      if (frame > 0.1) frame = 0.1;
      acc += frame;

      while (acc >= DT) {
        // release queued characters one by one
        if (
          queueRef.current.chars.length > 0 &&
          now >= queueRef.current.nextAt
        ) {
          const ch = queueRef.current.chars.shift()!;
          const x = 30 + Math.random() * (W - 60);
          spawnBody(world, {
            x,
            y: -20,
            vx: (Math.random() - 0.5) * 90,
            char: ch,
            color: colorFor(ch),
            r: 16,
          });
          queueRef.current.nextAt = now + 85;
          setCount(world.bodies.length);
        }
        step(world, DT);
        acc -= DT;
      }

      // render
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0d1017");
      bg.addColorStop(1, "#161b26");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // floor line
      ctx.strokeStyle = "rgba(251,191,36,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H - 6);
      ctx.lineTo(W, H - 6);
      ctx.stroke();

      for (const b of world.bodies) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.sin(b.angle) * 0.35);
        ctx.font = `bold ${b.r * 1.7}px "PingFang SC", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = b.sleeping ? "transparent" : b.color;
        ctx.shadowBlur = b.sleeping ? 0 : 10;
        ctx.fillStyle = b.color;
        ctx.globalAlpha = b.sleeping ? 0.92 : 1;
        ctx.fillText(b.char, 0, 1);
        ctx.restore();
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => {
      const w2 = canvas.clientWidth || W;
      resizeWorld(world, w2, H);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onUp);
      setGrabbed(null);
    };
  }, []);

  const drop = useCallback(() => {
    const chars = input.replace(/\s+/g, "").split("").slice(0, 200);
    if (chars.length === 0) return;
    queueRef.current.chars.push(...chars);
  }, [input]);

  const clearAll = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    world.bodies.length = 0;
    queueRef.current.chars.length = 0;
    setCount(0);
  }, []);

  const flipGravity = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    world.gravitySign *= -1;
    for (const b of world.bodies) b.sleeping = false;
    setFlipped((f) => !f);
  }, []);

  return (
    <div className="textdrop-wrap">
      <div className="textdrop-input-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          className="textdrop-textarea"
          placeholder="打一段字，让它们获得重量……"
        />
        <div className="textdrop-actions">
          <button onClick={drop} className="pagoda-btn pagoda-btn-primary">
            让它们落下 ↓
          </button>
          <button onClick={flipGravity} className="pagoda-btn">
            {flipped ? "恢复重力" : "反转重力"}
          </button>
          <button onClick={clearAll} className="pagoda-btn">
            清空
          </button>
        </div>
      </div>

      <div className="pagoda-stage">
        <canvas ref={canvasRef} className="textdrop-canvas" />
        <div className="pagoda-badge">{count} 个字在场</div>
      </div>
      <p className="pagoda-hint">
        自由落体 · 圆形刚体碰撞 · 可拖拽抛掷 · 反转重力让它们飞上天 · 上限 200 字
      </p>
    </div>
  );
}
