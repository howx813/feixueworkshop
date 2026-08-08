"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* 主题配色：跟随站点明暗主题（宝匣动画共用）                               */
/* ------------------------------------------------------------------ */

export type Palette = {
  accent: string;
  amber: string;
  emerald: string;
  rose: string;
  text: string;
  grid: string;
  faint: string;
};

const FALLBACK: Palette = {
  accent: "#6cb8c6",
  amber: "#d3b26a",
  emerald: "#5fc79a",
  rose: "#d86a52",
  text: "#98a2b3",
  grid: "rgba(255,255,255,0.10)",
  faint: "rgba(108,184,198,0.32)",
};

export function usePalette(): Palette {
  const [palette, setPalette] = useState<Palette>(FALLBACK);
  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      const v = (name: string, fb: string) =>
        cs.getPropertyValue(name).trim() || fb;
      setPalette({
        accent: v("--accent-fg", FALLBACK.accent),
        amber: v("--amber", FALLBACK.amber),
        emerald: v("--emerald", FALLBACK.emerald),
        rose: v("--rose", FALLBACK.rose),
        text: v("--text-1", FALLBACK.text),
        grid: v("--border-strong", FALLBACK.grid),
        faint: v("--accent-fg", FALLBACK.accent) + "55",
      });
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => mo.disconnect();
  }, []);
  return palette;
}

/* ------------------------------------------------------------------ */
/* 动画画布：dpr 适配 + rAF 循环 + prefers-reduced-motion               */
/* ------------------------------------------------------------------ */

export type DrawFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) => void;

export function AnimCanvas({
  draw,
  height,
  label,
}: {
  draw: DrawFn;
  height: number;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef<DrawFn>(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const t0 = performance.now();
    const frame = (now: number) => {
      drawRef.current(ctx, w, h, reduce ? 1.2 : (now - t0) / 1000);
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      style={{ width: "100%", height, display: "block" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* 解说词朗读（浏览器内置 TTS，本地合成，不上传）                          */
/* ------------------------------------------------------------------ */

export function SpeakButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" && "speechSynthesis" in window,
    );
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  if (!supported) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 1.05;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.speak(u);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={toggle}
      aria-pressed={speaking}
    >
      {speaking ? "■ 停止解说" : "▶ 朗读解说词"}
    </button>
  );
}

/** 解说词卡片：斜体引文 + 朗读按钮 */
export function Narration({
  text,
  children,
}: {
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: "12px 14px",
        borderRadius: "var(--radius-sm)",
        background: "var(--note-bg)",
        borderLeft: "3px solid var(--note-fg)",
      }}
    >
      <p
        className="item-body"
        style={{ margin: 0, color: "var(--note-fg)", fontStyle: "italic" }}
      >
        {children ?? text}
      </p>
      <div style={{ marginTop: 10 }}>
        <SpeakButton text={text} />
      </div>
    </div>
  );
}
