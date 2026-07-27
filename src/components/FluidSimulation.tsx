"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

const N = 128;
const SIZE = (N + 2) * (N + 2);
const IX = (i: number, j: number) => i + (N + 2) * j;

const PALETTE = [
  [56, 189, 248],
  [14, 165, 233],
  [125, 211, 252],
  [2, 132, 199],
  [186, 230, 253],
  [45, 212, 191],
];

class Fluid {
  dt: number;
  diff: number;
  visc: number;

  s: Float32Array;
  density: Float32Array;

  vx: Float32Array;
  vy: Float32Array;

  vx0: Float32Array;
  vy0: Float32Array;

  constructor(dt: number, diff: number, visc: number) {
    this.dt = dt;
    this.diff = diff;
    this.visc = visc;
    this.s = new Float32Array(SIZE);
    this.density = new Float32Array(SIZE);
    this.vx = new Float32Array(SIZE);
    this.vy = new Float32Array(SIZE);
    this.vx0 = new Float32Array(SIZE);
    this.vy0 = new Float32Array(SIZE);
  }

  addDensity(x: number, y: number, amount: number) {
    const idx = IX(x, y);
    this.density[idx] += amount;
  }

  addVelocity(x: number, y: number, amountX: number, amountY: number) {
    const idx = IX(x, y);
    this.vx[idx] += amountX;
    this.vy[idx] += amountY;
  }

  step() {
    diffuse(1, this.vx0, this.vx, this.visc, this.dt);
    diffuse(2, this.vy0, this.vy, this.visc, this.dt);

    project(this.vx0, this.vy0, this.vx, this.vy);

    advect(1, this.vx, this.vx0, this.vx0, this.vy0, this.dt);
    advect(2, this.vy, this.vy0, this.vx0, this.vy0, this.dt);

    project(this.vx, this.vy, this.vx0, this.vy0);

    diffuse(0, this.s, this.density, this.diff, this.dt);
    advect(0, this.density, this.s, this.vx, this.vy, this.dt);
  }
}

function setBnd(b: number, x: Float32Array) {
  for (let i = 1; i <= N; i++) {
    x[IX(0, i)] = b === 1 ? -x[IX(1, i)] : x[IX(1, i)];
    x[IX(N + 1, i)] = b === 1 ? -x[IX(N, i)] : x[IX(N, i)];
    x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
    x[IX(i, N + 1)] = b === 2 ? -x[IX(i, N)] : x[IX(i, N)];
  }
  x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
  x[IX(0, N + 1)] = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
  x[IX(N + 1, 0)] = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
  x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
}

function diffuse(b: number, x: Float32Array, x0: Float32Array, diff: number, dt: number) {
  const a = dt * diff * N * N;
  for (let k = 0; k < 10; k++) {
    for (let i = 1; i <= N; i++) {
      for (let j = 1; j <= N; j++) {
        x[IX(i, j)] =
          (x0[IX(i, j)] +
            a *
              (x[IX(i + 1, j)] +
                x[IX(i - 1, j)] +
                x[IX(i, j + 1)] +
                x[IX(i, j - 1)])) /
          (1 + 4 * a);
      }
    }
    setBnd(b, x);
  }
}

function project(velocX: Float32Array, velocY: Float32Array, p: Float32Array, div: Float32Array) {
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= N; j++) {
      div[IX(i, j)] =
        -0.5 *
        (velocX[IX(i + 1, j)] -
          velocX[IX(i - 1, j)] +
          velocY[IX(i, j + 1)] -
          velocY[IX(i, j - 1)]) /
        N;
      p[IX(i, j)] = 0;
    }
  }
  setBnd(0, div);
  setBnd(0, p);

  for (let k = 0; k < 10; k++) {
    for (let i = 1; i <= N; i++) {
      for (let j = 1; j <= N; j++) {
        p[IX(i, j)] =
          (div[IX(i, j)] +
            p[IX(i + 1, j)] +
            p[IX(i - 1, j)] +
            p[IX(i, j + 1)] +
            p[IX(i, j - 1)]) /
          4;
      }
    }
    setBnd(0, p);
  }

  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= N; j++) {
      velocX[IX(i, j)] -= 0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)]) * N;
      velocY[IX(i, j)] -= 0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)]) * N;
    }
  }
  setBnd(1, velocX);
  setBnd(2, velocY);
}

function advect(
  b: number,
  d: Float32Array,
  d0: Float32Array,
  velocX: Float32Array,
  velocY: Float32Array,
  dt: number,
) {
  let i0, j0, i1, j1;
  let x, y, s0, t0, s1, t1;
  const dt0 = dt * N;

  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= N; j++) {
      x = i - dt0 * velocX[IX(i, j)];
      y = j - dt0 * velocY[IX(i, j)];

      if (x < 0.5) x = 0.5;
      if (x > N + 0.5) x = N + 0.5;
      i0 = Math.floor(x);
      i1 = i0 + 1;

      if (y < 0.5) y = 0.5;
      if (y > N + 0.5) y = N + 0.5;
      j0 = Math.floor(y);
      j1 = j0 + 1;

      s1 = x - i0;
      s0 = 1 - s1;
      t1 = y - j0;
      t0 = 1 - t1;

      d[IX(i, j)] =
        s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) +
        s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
    }
  }
  setBnd(b, d);
}

export default function FluidSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fluidRef = useRef<Fluid>(new Fluid(0.05, 0.0001, 0.0001));
  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0, down: false });
  const displaySizeRef = useRef({ width: 1, height: 1 });
  const animationRef = useRef<number>(0);
  const colorIndexRef = useRef(0);
  const [viscosity, setViscosity] = useState(0.0001);
  const [diffusion, setDiffusion] = useState(0.0001);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fluid = fluidRef.current;
    const imageData = ctx.getImageData(0, 0, N, N);
    const data = imageData.data;

    for (let i = 1; i <= N; i++) {
      for (let j = 1; j <= N; j++) {
        const idx = (j - 1) * N + (i - 1);
        const fluidIdx = IX(i, j);
        const rawDensity = fluid.density[fluidIdx];
        const d = Math.min(rawDensity * 0.8, 1);

        // Background color #10151c
        const bgR = 16;
        const bgG = 21;
        const bgB = 28;

        // Color based on velocity angle + density
        const vx = fluid.vx[fluidIdx];
        const vy = fluid.vy[fluidIdx];
        const speed = Math.sqrt(vx * vx + vy * vy);
        const angle = Math.atan2(vy, vx);

        const baseColor = PALETTE[colorIndexRef.current % PALETTE.length];
        const dyeR = Math.min(255, baseColor[0] + speed * 20);
        const dyeG = Math.min(255, baseColor[1] + Math.sin(angle) * 30);
        const dyeB = Math.min(255, baseColor[2] + Math.cos(angle) * 30);

        data[idx * 4] = bgR + (dyeR - bgR) * d;
        data[idx * 4 + 1] = bgG + (dyeG - bgG) * d;
        data[idx * 4 + 2] = bgB + (dyeB - bgB) * d;
        data[idx * 4 + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  const animate = useCallback(() => {
    const fluid = fluidRef.current;
    const mouse = mouseRef.current;

    if (mouse.down) {
      const display = displaySizeRef.current;
      const gridX = Math.floor((mouse.x / display.width) * N) + 1;
      const gridY = Math.floor((mouse.y / display.height) * N) + 1;

      if (gridX >= 1 && gridX <= N && gridY >= 1 && gridY <= N) {
        const dx = mouse.x - mouse.px;
        const dy = mouse.y - mouse.py;
        fluid.addDensity(gridX, gridY, 200);
        fluid.addVelocity(gridX, gridY, dx * 0.05, dy * 0.05);
      }
    }

    fluid.step();
    draw();

    mouse.px = mouse.x;
    mouse.py = mouse.y;

    animationRef.current = requestAnimationFrame(animate);
  }, [draw]);

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    displaySizeRef.current = { width: rect.width, height: rect.height };
  }, []);

  useEffect(() => {
    updateSize();

    // Initial splash so the canvas isn't blank
    const fluid = fluidRef.current;
    const cx = Math.floor(N / 2);
    const cy = Math.floor(N / 2);
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        fluid.addDensity(cx + i, cy + j, 80);
      }
    }

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.touches[0].clientX - rect.left;
      mouseRef.current.y = e.touches[0].clientY - rect.top;
      mouseRef.current.down = true;
    };

    const handleDown = (e: MouseEvent | TouchEvent) => {
      if (e instanceof TouchEvent && e.touches.length > 0) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = e.touches[0].clientX - rect.left;
        mouseRef.current.y = e.touches[0].clientY - rect.top;
      }
      mouseRef.current.down = true;
      colorIndexRef.current = (colorIndexRef.current + 1) % PALETTE.length;
    };

    const handleUp = () => {
      mouseRef.current.down = false;
    };

    const handleResize = () => updateSize();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchstart", handleDown, { passive: false });
    window.addEventListener("touchend", handleUp);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchstart", handleDown);
      window.removeEventListener("touchend", handleUp);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateSize, animate]);

  useEffect(() => {
    fluidRef.current.visc = viscosity;
    fluidRef.current.diff = diffusion;
  }, [viscosity, diffusion]);

  const reset = () => {
    const fluid = fluidRef.current;
    fluid.density.fill(0);
    fluid.vx.fill(0);
    fluid.vy.fill(0);
    fluid.vx0.fill(0);
    fluid.vy0.fill(0);
    fluid.s.fill(0);
  };

  return (
    <div className="fluid-wrap">
      <div className="fluid-controls">
        <div className="fluid-control">
          <label>粘度</label>
          <input
            type="range"
            min="0.00001"
            max="0.001"
            step="0.00001"
            value={viscosity}
            onChange={(e) => setViscosity(parseFloat(e.target.value))}
          />
        </div>
        <div className="fluid-control">
          <label>扩散</label>
          <input
            type="range"
            min="0.00001"
            max="0.001"
            step="0.00001"
            value={diffusion}
            onChange={(e) => setDiffusion(parseFloat(e.target.value))}
          />
        </div>
        <button onClick={reset} className="fluid-reset">
          清空
        </button>
      </div>
      <div className="fluid-lab" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={N}
          height={N}
          className="fluid-canvas"
        />
      </div>
      <p className="fluid-hint">按住鼠标或手指划过，注入彩色流体染料</p>
    </div>
  );
}
