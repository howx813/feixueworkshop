"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* 主题配色：跟随站点明暗主题                                            */
/* ------------------------------------------------------------------ */

type Palette = {
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

function usePalette(): Palette {
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

type DrawFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) => void;

function AnimCanvas({
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
/* 波形数学                                                             */
/* ------------------------------------------------------------------ */

type WaveKind = "square" | "sawtooth" | "triangle";

/** 第 i 项（从 0 起）使用的谐波次数 k */
function harmonicK(kind: WaveKind, i: number): number {
  return kind === "sawtooth" ? i + 1 : 2 * i + 1;
}

/** 第 i 项的系数（幅度） */
function harmonicAmp(kind: WaveKind, i: number): number {
  const k = harmonicK(kind, i);
  if (kind === "square") return 4 / (Math.PI * k);
  if (kind === "sawtooth") return (2 / (Math.PI * k)) * (i % 2 === 0 ? 1 : -1);
  return (
    (8 / (Math.PI * Math.PI * k * k)) * (((k - 1) / 2) % 2 === 0 ? 1 : -1)
  );
}

/** 前 n 项叠加：theta 单位为弧度 */
function partialSum(kind: WaveKind, n: number, theta: number): number {
  let s = 0;
  for (let i = 0; i < n; i++) {
    s += harmonicAmp(kind, i) * Math.sin(harmonicK(kind, i) * theta);
  }
  return s;
}

/** 理想波形（无穷多项），phase ∈ [0, 2π) */
function idealValue(kind: WaveKind, phase: number): number {
  const p = phase / (Math.PI * 2);
  if (kind === "square") return p < 0.5 ? 1 : -1;
  if (kind === "sawtooth") return 1 - 2 * p;
  return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
}

const KIND_LABEL: Record<WaveKind, string> = {
  square: "方波",
  sawtooth: "锯齿波",
  triangle: "三角波",
};

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

/* ------------------------------------------------------------------ */
/* 动画一：用纯音搭积木（方波 = 奇次谐波叠加）                             */
/* ------------------------------------------------------------------ */

export function FourierBuildDemo() {
  const palette = usePalette();
  const [n, setN] = useState(1);

  const draw: DrawFn = (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const topH = h * 0.44;
    const midY1 = topH / 2 + 6;
    const midY2 = topH + (h - topH) / 2 + 4;
    const periods = 2;
    const speed = 1.6;

    // 基线
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY1);
    ctx.lineTo(w, midY1);
    ctx.moveTo(0, midY2);
    ctx.lineTo(w, midY2);
    ctx.stroke();

    // 上半：各个正弦分量
    for (let i = 0; i < n; i++) {
      const k = harmonicK("square", i);
      const amp = harmonicAmp("square", i) * topH * 0.4;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const theta = (x / w) * Math.PI * 2 * periods + t * speed;
        const y = midY1 - amp * Math.sin(k * theta);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = i === n - 1 ? palette.amber : palette.faint;
      ctx.lineWidth = i === n - 1 ? 1.8 : 1.1;
      ctx.stroke();
    }

    // 下半：理想方波（虚线）+ 当前叠加（实线）
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const phase = ((x / w) * periods + (t * speed) / (Math.PI * 2)) % 1;
      const y = midY2 - idealValue("square", (phase + 1) % 1 * Math.PI * 2) * (h - topH) * 0.34;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const theta = (x / w) * Math.PI * 2 * periods + t * speed;
      const y = midY2 - partialSum("square", n, theta) * (h - topH) * 0.34;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // 标注
    ctx.fillStyle = palette.text;
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(`纯音分量 ×${n}（最新加入的标黄）`, 8, 16);
    ctx.fillText("叠加结果 vs 理想方波（虚线）", 8, topH + 16);
  };

  return (
    <div className="card card-pad">
      <div className="snow-controls">
        <label className="snow-control">
          <span className="field-label">
            加入的纯音个数：{n}（频率 1, 3, 5 … {2 * n - 1} 倍）
          </span>
          <input
            type="range"
            min={1}
            max={9}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
        </label>
      </div>
      <AnimCanvas draw={draw} height={320} label="正弦波逐个叠加成方波的动画" />
      <p className="item-body" style={{ marginTop: 10 }}>
        上半屏：一条条光滑的纯音（正弦波）；下半屏：它们加起来的样子。
        纯音越多，越接近理想的方波虚线。加到无穷多条，就严丝合缝。
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 动画二：旋转的圆（epicycles）画出方波                                  */
/* ------------------------------------------------------------------ */

export function FourierEpicycleDemo() {
  const palette = usePalette();
  const [n, setN] = useState(4);
  const trailRef = useRef<number[]>([]);

  useEffect(() => {
    trailRef.current = [];
  }, [n]);

  const draw: DrawFn = (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const cx = Math.max(90, Math.min(w * 0.26, 170));
    const cy = h / 2;
    const R = Math.min(cx * 0.78, h * 0.4);
    const omega = (Math.PI * 2) / 6; // 6 秒一圈

    // 圆链
    let px = cx;
    let py = cy;
    for (let i = 0; i < n; i++) {
      const k = harmonicK("square", i);
      const r = Math.abs(harmonicAmp("square", i)) * R;
      const a = k * omega * t;
      const nx = px + r * Math.cos(a);
      const ny = py - r * Math.sin(a);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = i === n - 1 ? palette.amber : palette.accent;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      px = nx;
      py = ny;
    }

    // 端点
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = palette.amber;
    ctx.fill();

    // 右侧：端点高度随时间展开成波形
    const waveX0 = cx + R + 48;
    const maxLen = Math.floor(w - waveX0 - 10);
    if (maxLen > 30) {
      const trail = trailRef.current;
      trail.unshift(py);
      if (trail.length > maxLen) trail.length = maxLen;

      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = palette.grid;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(waveX0, py);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const x = waveX0 + i;
        if (i === 0) ctx.moveTo(x, trail[i]);
        else ctx.lineTo(x, trail[i]);
      }
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // 时间轴
      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(waveX0, cy);
      ctx.lineTo(w - 8, cy);
      ctx.stroke();
    }

    ctx.fillStyle = palette.text;
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(`${n} 个圆：转速 1, 3, 5 … ${2 * n - 1} 倍`, 8, 16);
    if (maxLen > 30) ctx.fillText("端点的高度 → 时间展开", waveX0, 16);
  };

  return (
    <div className="card card-pad">
      <div className="snow-controls">
        <label className="snow-control">
          <span className="field-label">圆环个数：{n}</span>
          <input
            type="range"
            min={1}
            max={24}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
        </label>
      </div>
      <AnimCanvas
        draw={draw}
        height={300}
        label="旋转圆环链的端点画出方波的动画"
      />
      <p className="item-body" style={{ marginTop: 10 }}>
        一条正弦波 = 一个匀速旋转的圆在竖直方向上的投影。大圆套小圆，
        每个圆转得更快、更小；盯住黄色端点的高度，往右展开就是波形本身。
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 动画三：时域 ⇄ 频域 联动实验室                                         */
/* ------------------------------------------------------------------ */

const MAX_TERMS = 24;

export function FourierSpectrumDemo() {
  const palette = usePalette();
  const [kind, setKind] = useState<WaveKind>("square");
  const [n, setN] = useState(6);

  const drawTime: DrawFn = (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const midY = h / 2 + 4;
    const scale = h * 0.34;
    const periods = 2;
    const speed = 1.6;

    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    // 理想波形（虚线）
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = palette.grid;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const phase =
        (((x / w) * periods + (t * speed) / (Math.PI * 2)) % 1) * Math.PI * 2;
      const y = midY - idealValue(kind, phase) * scale;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 当前 n 项叠加（实线）
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const theta = (x / w) * Math.PI * 2 * periods + t * speed;
      const y = midY - partialSum(kind, n, theta) * scale;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = palette.text;
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(`时域：${n} 个成分叠加（虚线 = 理想${KIND_LABEL[kind]}）`, 8, 16);
  };

  const drawFreq: DrawFn = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const base = h - 22;
    const maxBar = h - 46;
    const barW = w / MAX_TERMS;

    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, base);
    ctx.lineTo(w, base);
    ctx.stroke();

    for (let k = 1; k <= MAX_TERMS; k++) {
      // 找到 k 对应的项序号（没有则系数为 0）
      let idx = -1;
      if (kind === "sawtooth") idx = k - 1;
      else if (k % 2 === 1) idx = (k - 1) / 2;
      const amp = idx >= 0 ? Math.abs(harmonicAmp(kind, idx)) : 0;
      const norm =
        amp / Math.abs(harmonicAmp(kind, 0)); // 以基波为 1
      const bh = norm * maxBar;
      const active = idx >= 0 && idx < n;
      const x = (k - 1) * barW + barW * 0.18;
      ctx.fillStyle = active ? palette.accent : palette.faint;
      if (bh > 0.5) {
        ctx.fillRect(x, base - bh, barW * 0.64, bh);
      }
      if (k === 1 || k % 4 === 0) {
        ctx.fillStyle = palette.text;
        ctx.font = "9px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${k}`, (k - 1) * barW + barW / 2, base + 12);
        ctx.textAlign = "left";
      }
    }

    ctx.fillStyle = palette.text;
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText("频域：每根柱子 = 一个频率成分（×基波频率）", 8, 16);
  };

  return (
    <div className="card card-pad">
      <div className="snow-controls">
        <div className="theme-switch" role="group" aria-label="波形选择">
          {(Object.keys(KIND_LABEL) as WaveKind[]).map((k2) => (
            <button
              key={k2}
              type="button"
              className={`theme-switch-btn${kind === k2 ? " active" : ""}`}
              onClick={() => setKind(k2)}
            >
              {KIND_LABEL[k2]}
            </button>
          ))}
        </div>
        <label className="snow-control">
          <span className="field-label">
            使用的频率成分：前 {n} 个（亮柱）
          </span>
          <input
            type="range"
            min={1}
            max={MAX_TERMS}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
        </label>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <AnimCanvas draw={drawTime} height={220} label="时域波形动画" />
        </div>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <AnimCanvas draw={drawFreq} height={220} label="频域频谱柱状图" />
        </div>
      </div>
      <p className="item-body" style={{ marginTop: 10 }}>
        左边是「什么时候振多狠」（时域），右边是「由哪些频率组成」（频域）——
        同一段信号的两种看法。拨动滑杆：右边每亮一根柱子，左边就添一笔。
        注意方波在棱角的「小尾巴」（吉布斯现象）：成分不够多时永远抚不平。
      </p>
    </div>
  );
}
