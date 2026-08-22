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
  const particlesRef = useRef<
    { x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }[]
  >([]);
  const ringsRef = useRef<{ x: number; y: number; r: number; maxR: number; alpha: number }[]>([]);
  const flashRef = useRef(0);
  const sizeRef = useRef({ w: 800, h: 520 });
  const autoBombAtRef = useRef<number | null>(null);
  const explodeRef = useRef<() => void>(() => {});
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
    sizeRef.current = { w: W, h: H };

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

      // auto-detonate: once every character has settled, hold for a beat, then BOOM
      const queueEmpty = queueRef.current.chars.length === 0;
      const allSettled =
        world.bodies.length >= 3 && world.bodies.every((b) => b.sleeping);
      if (queueEmpty && allSettled) {
        if (autoBombAtRef.current === null) {
          autoBombAtRef.current = now + 1300; // let the pile sit for a beat
        } else if (now >= autoBombAtRef.current) {
          autoBombAtRef.current = null;
          explodeRef.current();
        }
      } else {
        autoBombAtRef.current = null;
      }

      // render
      const rdt = Math.min(frame, 0.05);

      ctx.clearRect(0, 0, W, H);
      let bg;
      if (flashRef.current > 0) {
        bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#3a3020");
        bg.addColorStop(1, "#1c1626");
        flashRef.current = Math.max(0, flashRef.current - rdt * 3);
      } else {
        bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#0d1017");
        bg.addColorStop(1, "#161b26");
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // floor line
      ctx.strokeStyle = "rgba(251,191,36,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H - 6);
      ctx.lineTo(W, H - 6);
      ctx.stroke();

      // shockwave rings
      for (let i = ringsRef.current.length - 1; i >= 0; i--) {
        const ring = ringsRef.current[i];
        ring.r += (ring.maxR - ring.r) * Math.min(1, rdt * 5.5);
        ring.alpha -= rdt * 1.4;
        if (ring.alpha <= 0) {
          ringsRef.current.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(251,191,36,${ring.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // particles: gravity + floor bounce + fade
      const parts = particlesRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.vy += 1500 * rdt;
        p.x += p.vx * rdt;
        p.y += p.vy * rdt;
        if (p.y > H - 8) {
          p.y = H - 8;
          p.vy *= -0.45;
          p.vx *= 0.85;
        }
        p.life -= rdt * 0.55;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.min(1, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

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

  const explode = useCallback(() => {
    const world = worldRef.current;
    if (!world || world.bodies.length === 0) return;

    // centroid of all bodies
    let cx = 0;
    let cy = 0;
    for (const b of world.bodies) {
      cx += b.x;
      cy += b.y;
    }
    cx /= world.bodies.length;
    cy /= world.bodies.length;

    // each character shatters into a shard burst, flying away from the centroid
    for (const b of world.bodies) {
      let dx = b.x - cx;
      let dy = b.y - cy;
      let d = Math.hypot(dx, dy);
      if (d < 1) {
        dx = Math.random() - 0.5;
        dy = Math.random() - 0.5;
        d = Math.hypot(dx, dy);
      }
      const nx = dx / d;
      const ny = dy / d;
      for (let s = 0; s < 7; s++) {
        const spread = 0.55;
        const ang = Math.atan2(ny, nx) + (Math.random() - 0.5) * spread;
        const speed = 260 + Math.random() * 420;
        particlesRef.current.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed - 120,
          life: 1 + Math.random() * 0.6,
          size: 2.2 + Math.random() * 3,
          color: b.color,
        });
      }
    }

    // double shockwave from the centroid + white flash
    const { w: cw, h: chh } = sizeRef.current;
    ringsRef.current.push({ x: cx, y: cy, r: 8, maxR: Math.max(cw, chh) * 0.7, alpha: 0.9 });
    ringsRef.current.push({ x: cx, y: cy, r: 4, maxR: cw * 0.45, alpha: 0.7 });
    flashRef.current = 1;

    world.bodies.length = 0;
    setCount(0);
  }, []);

  useEffect(() => {
    explodeRef.current = explode;
  }, [explode]);

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
          <button onClick={explode} className="pagoda-btn textdrop-explode">
            💥 提前引爆
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
        自由落体 · 刚体碰撞 · 拖拽抛掷 · 字全部落定后自动引爆成粒子 · 手动按钮可提前引爆 · 上限 200 字
      </p>
    </div>
  );
}
