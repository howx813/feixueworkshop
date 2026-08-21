"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  generateGarden,
  PALETTE,
  type VoxelBlock,
} from "@/lib/pagoda-world";

/**
 * Fully explorable voxel pagoda garden.
 * - orbit camera (drag to rotate, wheel to zoom)
 * - procedural world from a seed
 * - zero asset loads: every block is a colored cube face
 * - hidden faces culled; visible faces depth-sorted per frame
 */

type Face = {
  pts: number[][]; // 4 corners in world space
  nx: number;
  ny: number;
  nz: number;
  color: string;
  cx: number;
  cy: number;
  cz: number;
};

// 6 face directions with corner offsets (unit cube at origin)
const FACES: Array<{
  n: [number, number, number];
  corners: number[][];
  shade: number;
}> = [
  { n: [0, 1, 0], shade: 1.0, corners: [[0,1,0],[1,1,0],[1,1,1],[0,1,1]] },   // top
  { n: [0, 0, 1], shade: 0.78, corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },  // south
  { n: [0, 0, -1], shade: 0.62, corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]] }, // north
  { n: [1, 0, 0], shade: 0.7, corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]] },   // east
  { n: [-1, 0, 0], shade: 0.7, corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]] },  // west
];

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export default function PagodaGarden() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef({ yaw: 0.7, pitch: 0.42, dist: 46 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const autoRef = useRef(true);
  const facesRef = useRef<Face[]>([]);
  const rafRef = useRef<number>(0);
  const [seed, setSeed] = useState(20260821);
  const [blockCount, setBlockCount] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  // build world + extract visible faces whenever seed changes
  useEffect(() => {
    const { blocks, meta } = generateGarden(seed);
    setBlockCount(meta.count);

    const solid = new Set(blocks.map((b) => `${b.x},${b.y},${b.z}`));
    const has = (x: number, y: number, z: number) =>
      solid.has(`${x},${y},${z}`);

    const faces: Face[] = [];
    for (const b of blocks as VoxelBlock[]) {
      const rgb = hexToRgb(PALETTE[b.c]);
      for (const f of FACES) {
        const [nx, ny, nz] = f.n;
        if (has(b.x + nx, b.y + ny, b.z + nz)) continue; // hidden
        const pts = f.corners.map(([dx, dy, dz]) => [
          b.x + dx,
          b.y + dy,
          b.z + dz,
        ]);
        const [r, g, bl] = rgb;
        faces.push({
          pts,
          nx,
          ny,
          nz,
          color: `rgb(${Math.round(r * f.shade)},${Math.round(
            g * f.shade
          )},${Math.round(bl * f.shade)})`,
          cx: b.x + 0.5 + nx * 0.5,
          cy: b.y + 0.5 + ny * 0.5,
          cz: b.z + 0.5 + nz * 0.5,
        });
      }
    }
    facesRef.current = faces;
  }, [seed]);

  // render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      if (autoRef.current) camRef.current.yaw += 0.0022;
      const { yaw, pitch, dist } = camRef.current;

      // camera position on orbit, looking at garden center
      const cy = 6; // look-at height
      const eyeX = Math.sin(yaw) * Math.cos(pitch) * dist;
      const eyeY = cy + Math.sin(pitch) * dist;
      const eyeZ = Math.cos(yaw) * Math.cos(pitch) * dist;

      // view basis
      const fwdX = -eyeX;
      const fwdY = cy - eyeY;
      const fwdZ = -eyeZ;
      const fl = Math.hypot(fwdX, fwdY, fwdZ);
      const fx = fwdX / fl;
      const fy = fwdY / fl;
      const fz = fwdZ / fl;
      // right = normalize(cross(fwd, up))
      let rx = fz;
      const ry = 0;
      let rz = -fx;
      const rl = Math.hypot(rx, ry, rz) || 1;
      rx /= rl;
      rz /= rl;
      // up = cross(right, fwd)
      const ux = ry * fz - rz * fy;
      const uy = rz * fx - rx * fz;
      const uz = rx * fy - ry * fx;

      const focal = Math.max(w, h) * 1.15;

      const project = (px: number, py: number, pz: number) => {
        const dx = px - eyeX;
        const dy = py - eyeY;
        const dz = pz - eyeZ;
        const cz = dx * fx + dy * fy + dz * fz; // depth along view
        const cxx = dx * rx + dy * ry + dz * rz;
        const cyy = dx * ux + dy * uy + dz * uz;
        const s = focal / Math.max(cz, 0.5);
        return { sx: w / 2 + cxx * s, sy: h / 2 - cyy * s, depth: cz };
      };

      // sky gradient
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#10141c");
      g.addColorStop(0.55, "#1a2233");
      g.addColorStop(1, "#232d3f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // transform + sort + draw
      const faces = facesRef.current;
      const projected: {
        p: Array<{ sx: number; sy: number }>;
        depth: number;
        color: string;
      }[] = [];
      for (const f of faces) {
        const pp = [];
        let depth = 0;
        let behind = false;
        for (const [px, py, pz] of f.pts) {
          const pr = project(px, py, pz);
          if (pr.depth < 1) behind = true;
          pp.push(pr);
          depth += pr.depth;
        }
        if (behind) continue;
        projected.push({ p: pp, depth: depth / 4, color: f.color });
      }
      projected.sort((a, b) => b.depth - a.depth); // far → near

      ctx.globalAlpha = 1;
      for (const f of projected) {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.moveTo(f.p[0].sx, f.p[0].sy);
        for (let i = 1; i < 4; i++) ctx.lineTo(f.p[i].sx, f.p[i].sy);
        ctx.closePath();
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // pointer controls
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    camRef.current.yaw -= dx * 0.006;
    camRef.current.pitch = Math.min(
      1.35,
      Math.max(-0.15, camRef.current.pitch + dy * 0.005)
    );
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    camRef.current.dist = Math.min(
      90,
      Math.max(18, camRef.current.dist + e.deltaY * 0.04)
    );
  }, []);

  const regenerate = () => {
    const next = Math.floor(Math.random() * 1e9);
    setSeed(next);
  };

  const toggleAuto = () => {
    autoRef.current = !autoRef.current;
    setAutoRotate(autoRef.current);
  };

  return (
    <div className="pagoda-wrap">
      <div className="pagoda-stage">
        <canvas
          ref={canvasRef}
          className="pagoda-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        />
        <div className="pagoda-badge">
          {blockCount} 方块 · 种子 {seed}
        </div>
      </div>
      <div className="pagoda-controls">
        <button onClick={regenerate} className="pagoda-btn pagoda-btn-primary">
          ⟳ 换一座花园
        </button>
        <button onClick={toggleAuto} className="pagoda-btn">
          {autoRotate ? "暂停旋转" : "自动旋转"}
        </button>
      </div>
      <p className="pagoda-hint">
        拖拽环绕 · 滚轮缩放 · 程序生成，零资源加载 · 隐藏面剔除后逐帧深度排序
      </p>
    </div>
  );
}
