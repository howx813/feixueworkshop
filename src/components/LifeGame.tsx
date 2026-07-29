"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  clear,
  createBoard,
  GLIDER,
  GOSPER_GUN,
  PULSAR,
  placePattern,
  randomize,
  step,
} from "@/lib/life-core";

const GRID_W = 80;
const GRID_H = 60;
const CELL = 8;
const GAP = 1;
const LIVE_COLOR = "#4fa3b3";
const BG_COLOR = "#10151c";
const GRID_COLOR = "rgba(255,255,255,0.08)";

interface MouseState {
  x: number;
  y: number;
  down: boolean;
  paintTo?: number;
}

export default function LifeGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef(createBoard(GRID_W, GRID_H));
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dprRef = useRef(1);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const speedRef = useRef(100);
  const mouseRef = useRef<MouseState>({ x: -1, y: -1, down: false });
  const lastStepRef = useRef(0);

  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [generation, setGeneration] = useState(0);

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { runningRef.current = running; }, [running]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const dpr = dprRef.current;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const board = boardRef.current;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // 网格线
    ctx.fillStyle = GRID_COLOR;
    for (let x = 0; x <= GRID_W; x++) {
      const px = x * (CELL + GAP);
      ctx.fillRect(px, 0, GAP, GRID_H * (CELL + GAP));
    }
    for (let y = 0; y <= GRID_H; y++) {
      const py = y * (CELL + GAP);
      ctx.fillRect(0, py, GRID_W * (CELL + GAP), GAP);
    }

    // 细胞
    ctx.fillStyle = LIVE_COLOR;
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (board.current[y * GRID_W + x]) {
          const px = x * (CELL + GAP);
          const py = y * (CELL + GAP);
          ctx.fillRect(px, py, CELL, CELL);
        }
      }
    }

    // 鼠标悬停高亮
    const { x: mx, y: my } = mouseRef.current;
    if (mx >= 0 && mx < GRID_W && my >= 0 && my < GRID_H && !mouseRef.current.down) {
      const px = mx * (CELL + GAP);
      const py = my * (CELL + GAP);
      ctx.strokeStyle = "#6cb8c6";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - 0.5, py - 0.5, CELL + 1, CELL + 1);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const board = boardRef.current;
    randomize(board, 0.2);
    setGeneration(0);

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;

      // 设置 Canvas 物理像素尺寸（会重置 context 状态）
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      // 重新设置变换矩阵
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      draw();
    };

    const posFromEvent = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const cellFromPos = (x: number, y: number) => ({
      cx: (x / (CELL + GAP)) | 0,
      cy: (y / (CELL + GAP)) | 0,
    });

    const handlePaint = (cx: number, cy: number, alive: number) => {
      const i = cy * GRID_W + cx;
      if (board.current[i] !== alive) {
        board.current[i] = alive;
        draw();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      canvas.setPointerCapture?.(e.pointerId);
      mouseRef.current.down = true;
      const { x, y } = posFromEvent(e);
      const { cx, cy } = cellFromPos(x, y);
      mouseRef.current.x = cx;
      mouseRef.current.y = cy;
      if (cx >= 0 && cx < GRID_W && cy >= 0 && cy < GRID_H) {
        const alive = board.current[cy * GRID_W + cx] ? 0 : 1;
        mouseRef.current.paintTo = alive;
        handlePaint(cx, cy, alive);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const { x, y } = posFromEvent(e);
      const { cx, cy } = cellFromPos(x, y);
      mouseRef.current.x = cx;
      mouseRef.current.y = cy;
      if (mouseRef.current.down) {
        const paintTo = mouseRef.current.paintTo ?? 1;
        if (cx >= 0 && cx < GRID_W && cy >= 0 && cy < GRID_H) {
          handlePaint(cx, cy, paintTo);
        }
      } else {
        draw(); // 更新悬停高亮
      }
    };

    const onPointerUp = () => {
      mouseRef.current.down = false;
      mouseRef.current.paintTo = undefined;
    };

    const animate = (ts: number) => {
      if (runningRef.current) {
        const interval = speedRef.current;
        if (ts - lastStepRef.current >= interval) {
          step(board);
          lastStepRef.current = ts;
          setGeneration((g) => g + 1);
          draw();
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
      window.removeEventListener("resize", updateSize);
      ro?.disconnect();
      ctxRef.current = null;
    };
  }, [draw]);

  const resetRandom = () => {
    randomize(boardRef.current, 0.2);
    setGeneration(0);
    draw();
  };

  const place = (pattern: number[][]) => {
    clear(boardRef.current);
    placePattern(boardRef.current, pattern);
    setGeneration(0);
    draw();
  };

  const doStep = () => {
    step(boardRef.current);
    setGeneration((g) => g + 1);
    draw();
  };

  const doClear = () => {
    clear(boardRef.current);
    setGeneration(0);
    draw();
  };

  return (
    <div className="life-wrap">
      <div className="life-controls">
        <button
          type="button"
          className={`btn ${running ? "btn-ghost" : "btn-primary"}`}
          onClick={() => setRunning(!running)}
        >
          {running ? "暂停" : "播放"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={doStep}>
          步进
        </button>
        <button type="button" className="btn btn-ghost" onClick={doClear}>
          清空
        </button>
        <button type="button" className="btn btn-ghost" onClick={resetRandom}>
          随机
        </button>
        <div className="life-patterns">
          <button type="button" className="btn btn-ghost" onClick={() => place(GLIDER)}>
            滑翔机
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => place(PULSAR)}>
            脉冲星
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => place(GOSPER_GUN)}>
            滑翔机枪
          </button>
        </div>
        <label className="life-slider">
          速度
          <input
            type="range"
            min={20}
            max={500}
            step={10}
            value={550 - speed}
            onChange={(e) => setSpeed(550 - Number(e.target.value))}
          />
        </label>
        <span className="life-gen">第 {generation} 代</span>
      </div>
      <div className="life-lab" ref={containerRef}>
        <canvas ref={canvasRef} className="life-canvas" />
      </div>
      <p className="life-hint">
        点击或拖拽画布绘制细胞 · 滑翔机/脉冲星/滑翔机枪一键加载经典图案
      </p>
    </div>
  );
}
