"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

const COLORS = [
  "#38bdf8",
  "#7dd3fc",
  "#bae6fd",
  "#0ea5e9",
  "#0284c7",
  "#e0f2fe",
];

const MAX_PARTICLES = 4500;

interface ParticleData {
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  ease: number;
  friction: number;
}

function createParticle(x: number, y: number, color: string): ParticleData {
  return {
    x: Math.random() * x * 2,
    y: Math.random() * y * 2,
    originX: x,
    originY: y,
    size: Math.random() * 1.2 + 0.8,
    color,
    vx: 0,
    vy: 0,
    ease: Math.random() * 0.04 + 0.02,
    friction: Math.random() * 0.08 + 0.9,
  };
}

export default function ParticleText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ParticleData[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, radius: 100 });
  const animationRef = useRef<number>(0);
  const [text, setText] = useState("飞雪工坊");
  const [inputValue, setInputValue] = useState("飞雪工坊");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const buildParticles = useCallback(async (targetText: string, width: number, height: number) => {
    if (width <= 0 || height <= 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Wait for Chinese fonts to load, but don't hang forever
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);
    } catch {
      // ignore
    }

    ctx.clearRect(0, 0, width, height);

    const fontSize = Math.min(
      (width * 0.8) / Math.max(targetText.length, 2),
      height * 0.4,
    );
    ctx.font = `bold ${fontSize}px "PingFang SC", "STHeiti", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(targetText, width / 2, height / 2);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const newParticles: ParticleData[] = [];

    // Adaptive step based on area to keep particle count reasonable
    // Mobile gets larger step for performance
    const area = width * height;
    const isMobile = width < 640;
    let step = isMobile ? 6 : 4;
    if (area > 600000) step = isMobile ? 7 : 5;
    if (area > 1000000) step = isMobile ? 8 : 6;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        if (alpha > 128) {
          const color = COLORS[Math.floor(Math.random() * COLORS.length)];
          newParticles.push(createParticle(x, y, color));
          if (newParticles.length >= MAX_PARTICLES) break;
        }
      }
      if (newParticles.length >= MAX_PARTICLES) break;
    }

    particlesRef.current = newParticles;
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "rgba(10, 16, 24, 0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const mouse = mouseRef.current;
    const particles = particlesRef.current;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < mouse.radius && distance > 0) {
        const force = (mouse.radius - distance) / mouse.radius;
        p.vx -= (dx / distance) * force * 12;
        p.vy -= (dy / distance) * force * 12;
      }

      p.vx += (p.originX - p.x) * p.ease;
      p.vy += (p.originY - p.y) * p.ease;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.x += p.vx;
      p.y += p.vy;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    setDimensions({ width, height });
  }, []);

  useEffect(() => {
    updateSize();
    animate();

    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.touches[0].clientX - rect.left;
      mouseRef.current.y = e.touches[0].clientY - rect.top;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.touches[0].clientX - rect.left;
      mouseRef.current.y = e.touches[0].clientY - rect.top;
    };

    const handleLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    const handleResize = () => {
      updateSize();
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleLeave);
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchend", handleLeave);
    window.addEventListener("resize", handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateSize());
      resizeObserver.observe(container);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleLeave);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleLeave);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    };
  }, [updateSize, animate]);

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      buildParticles(text, dimensions.width, dimensions.height);
    }
  }, [text, dimensions, buildParticles]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const value = inputValue.trim().slice(0, 12);
      if (value) {
        setText(value);
      }
    }
  };

  return (
    <div className="particle-wrap">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value.slice(0, 12))}
        onKeyDown={handleKeyDown}
        placeholder="输入文字，按回车生成粒子..."
        className="particle-input particle-input-top"
      />
      <div className="particle-lab" ref={containerRef}>
        <canvas ref={canvasRef} className="particle-canvas" />
      </div>
      <p className="particle-hint">移动鼠标驱散粒子，静止后自动聚合 · 回车切换文字</p>
    </div>
  );
}
