"use client";

import React, { useEffect, useRef, useState } from "react";
import { createFluidSimulation, type FluidHandle } from "@/lib/fluid-webgl";

/**
 * GPU-accelerated Navier-Stokes fluid lab.
 * Core simulation vendored from WebGL-Fluid-Simulation (MIT, © Pavel Dobryakov).
 */
export default function FluidSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fluidRef = useRef<FluidHandle | null>(null);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [radius, setRadius] = useState(0.25);
  const [dissipation, setDissipation] = useState(1.0);
  const [curl, setCurl] = useState(30);
  const [colorSpeed, setColorSpeed] = useState(10);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let handle: FluidHandle | null = null;
    try {
      handle = createFluidSimulation(canvas, {
        DENSITY_DISSIPATION: 1.0,
        VELOCITY_DISSIPATION: 0.3,
        SPLAT_RADIUS: 0.25,
        CURL: 30,
        COLOR_UPDATE_SPEED: 10,
      });
      fluidRef.current = handle;
    } catch (err) {
      console.error("fluid: WebGL init failed", err);
      setFailed(true);
    }
    return () => {
      handle?.destroy();
      fluidRef.current = null;
    };
  }, []);

  useEffect(() => {
    fluidRef.current?.setConfig({ SPLAT_RADIUS: radius });
  }, [radius]);

  useEffect(() => {
    fluidRef.current?.setConfig({ DENSITY_DISSIPATION: dissipation });
  }, [dissipation]);

  useEffect(() => {
    fluidRef.current?.setConfig({ CURL: curl });
  }, [curl]);

  useEffect(() => {
    fluidRef.current?.setConfig({ COLOR_UPDATE_SPEED: colorSpeed });
  }, [colorSpeed]);

  const randomSplat = () => {
    fluidRef.current?.randomSplats();
  };

  const togglePause = () => {
    const next = fluidRef.current?.togglePause() ?? false;
    setPaused(next);
  };

  if (failed) {
    return (
      <div className="fluid-wrap">
        <div className="fluid-lab fluid-lab-fallback">
          <p>当前浏览器不支持 WebGL，无法运行 GPU 流体模拟。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fluid-wrap">
      <div className="fluid-controls">
        <div className="fluid-control">
          <label>笔刷</label>
          <input
            type="range"
            min="0.03"
            max="0.8"
            step="0.01"
            value={radius}
            onChange={(e) => setRadius(parseFloat(e.target.value))}
            aria-label="泼溅半径"
          />
        </div>
        <div className="fluid-control">
          <label>残留</label>
          <input
            type="range"
            min="0.2"
            max="3"
            step="0.1"
            value={dissipation}
            onChange={(e) => setDissipation(parseFloat(e.target.value))}
            aria-label="染料残留时长"
          />
        </div>
        <div className="fluid-control">
          <label>旋度</label>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={curl}
            onChange={(e) => setCurl(parseFloat(e.target.value))}
            aria-label="涡旋强度"
          />
        </div>
        <div className="fluid-control">
          <label>变色</label>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={colorSpeed}
            onChange={(e) => setColorSpeed(parseFloat(e.target.value))}
            aria-label="色彩流速"
          />
        </div>
        <button onClick={randomSplat} className="fluid-reset">
          随机泼溅
        </button>
        <button onClick={togglePause} className="fluid-reset">
          {paused ? "继续" : "暂停"}
        </button>
      </div>
      <div className="fluid-lab">
        <canvas ref={canvasRef} className="fluid-canvas-gl" />
      </div>
      <p className="fluid-hint">
        拖动鼠标搅动流体 · 空格键随机泼溅 · P 键暂停 · GPU 实时求解
      </p>
    </div>
  );
}
