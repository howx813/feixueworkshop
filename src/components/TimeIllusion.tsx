"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildCrystalMesh,
  displaceVertex,
  faceNormal,
  project,
  rotateX,
  rotateY,
  type Vec3,
} from "@/lib/crystal-morph-core";

type Star = { x: number; y: number; r: number; a: number };

const QUOTE_CN =
  "相信物理学的人知道：过去、现在与未来之间的分别，不过是一种顽固的幻觉。";
const QUOTE_EN =
  "People like us, who believe in physics, know that the distinction between past, present and future is only a stubbornly persistent illusion.";
const ATTR = "— Albert Einstein";

export default function TimeIllusion() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const meshRef = useRef(buildCrystalMesh(2));
  const starsRef = useRef<Star[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const runningRef = useRef(true);
  const amountRef = useRef(0.42);
  const speedRef = useRef(1);

  const [running, setRunning] = useState(true);
  const [amount, setAmount] = useState(0.42);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    amountRef.current = amount;
  }, [amount]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      meshRef.current = buildCrystalMesh(1);
      speedRef.current = 0.4;
      setSpeed(0.4);
    }

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
      starsRef.current = Array.from({ length: 120 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.7 + 0.15,
      }));
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let t = 0;
    let last = performance.now();

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (runningRef.current) t += dt * speedRef.current;

      const { w, h } = sizeRef.current;
      if (w <= 0 || h <= 0) return;

      // Space background
      const g = ctx.createRadialGradient(
        w * 0.5,
        h * 0.55,
        10,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.75,
      );
      g.addColorStop(0, "#1a1030");
      g.addColorStop(0.45, "#0c1020");
      g.addColorStop(1, "#05060c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Nebula soft blobs
      for (let i = 0; i < 3; i++) {
        const nx = w * (0.35 + 0.15 * Math.sin(t * 0.2 + i));
        const ny = h * (0.55 + 0.08 * Math.cos(t * 0.15 + i * 2));
        const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, w * 0.35);
        ng.addColorStop(0, `rgba(120, 80, 200, ${0.12 - i * 0.02})`);
        ng.addColorStop(1, "rgba(10, 10, 20, 0)");
        ctx.fillStyle = ng;
        ctx.fillRect(0, 0, w, h);
      }

      // Stars
      for (const s of starsRef.current) {
        ctx.fillStyle = `rgba(220, 230, 255, ${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crystal
      const mesh = meshRef.current;
      const amount = amountRef.current;
      const scale = Math.min(w, h) * 0.38;
      const rotY = t * 0.45;
      const rotX = 0.35 + Math.sin(t * 0.25) * 0.25;

      const world: Vec3[] = mesh.vertices.map((v) => {
        let p = displaceVertex(v, t, amount);
        p = rotateY(p, rotY);
        p = rotateX(p, rotX);
        return p;
      });

      type FaceDraw = {
        i: number;
        depth: number;
        pts: { x: number; y: number; z: number }[];
        lit: number;
      };
      const draws: FaceDraw[] = [];

      mesh.faces.forEach((face, i) => {
        const [ia, ib, ic] = face;
        const a = world[ia];
        const b = world[ib];
        const c = world[ic];
        const n = faceNormal(a, b, c);
        // Camera looks from +z toward origin; cull backfaces loosely
        const viewZ = (a.z + b.z + c.z) / 3;
        const lit = Math.max(0, n.x * 0.25 + n.y * 0.15 + n.z * 0.9);
        if (lit < 0.02) return;
        const pa = project(a, w, h, scale);
        const pb = project(b, w, h, scale);
        const pc = project(c, w, h, scale);
        draws.push({
          i,
          depth: viewZ,
          pts: [pa, pb, pc],
          lit,
        });
      });

      draws.sort((a, b) => a.depth - b.depth);

      // Soft glow pass (edges)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const f of draws) {
        const alpha = 0.04 + f.lit * 0.08;
        ctx.strokeStyle = `rgba(160, 210, 255, ${alpha})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(f.pts[0].x, f.pts[0].y);
        ctx.lineTo(f.pts[1].x, f.pts[1].y);
        ctx.lineTo(f.pts[2].x, f.pts[2].y);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();

      // Filled facets
      for (const f of draws) {
        const a = 0.06 + f.lit * 0.18;
        ctx.fillStyle = `rgba(180, 200, 255, ${a})`;
        ctx.strokeStyle = `rgba(210, 230, 255, ${0.25 + f.lit * 0.55})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(f.pts[0].x, f.pts[0].y);
        ctx.lineTo(f.pts[1].x, f.pts[1].y);
        ctx.lineTo(f.pts[2].x, f.pts[2].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div>
      <div
        ref={wrapRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          aspectRatio: "748 / 638",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          overflow: "hidden",
          background: "#05060c",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: "100%", height: "100%" }}
          aria-label="时间幻觉 · 晶体变形动画"
        />
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            left: 16,
            right: 16,
            top: 18,
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.92)",
              fontSize: "clamp(0.78rem, 2.6vw, 0.95rem)",
              lineHeight: 1.55,
              fontWeight: 500,
              textShadow: "0 1px 8px rgba(0,0,0,0.65)",
            }}
          >
            {QUOTE_CN}
          </p>
          <p
            style={{
              margin: "8px 0 0",
              color: "rgba(220,230,255,0.55)",
              fontSize: "clamp(0.62rem, 2vw, 0.72rem)",
              lineHeight: 1.45,
              fontStyle: "italic",
            }}
          >
            {QUOTE_EN}
          </p>
          <p
            style={{
              margin: "6px 0 0",
              color: "rgba(200,210,240,0.7)",
              fontSize: "0.7rem",
            }}
          >
            {ATTR}
          </p>
        </div>
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
        <span style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>
          复刻灵感：星空 + 半透明晶体连续变形
        </span>
      </div>

      <div className="tender-keygrid" style={{ marginTop: 12 }} aria-label="参数">
        <label className="tender-keycell">
          <span className="tender-keylabel">形变强度 {amount.toFixed(2)}</span>
          <input
            type="range"
            min={0.05}
            max={0.85}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>
        <label className="tender-keycell">
          <span className="tender-keylabel">转速 {speed.toFixed(2)}</span>
          <input
            type="range"
            min={0.2}
            max={2}
            step={0.05}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
