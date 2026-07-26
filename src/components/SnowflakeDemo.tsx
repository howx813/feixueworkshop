"use client";

import { useMemo, useState } from "react";
import {
  crystalSnowflakeSegments,
  kochSnowflakePath,
} from "@/lib/koch-snowflake";

export function SnowflakeDemo() {
  const [depth, setDepth] = useState(3);
  const [sides, setSides] = useState(3);
  const [mode, setMode] = useState<"koch" | "crystal">("koch");

  const kochPath = useMemo(
    () => kochSnowflakePath(depth, 50, 50, 38, sides),
    [depth, sides],
  );
  const crystal = useMemo(
    () => crystalSnowflakeSegments(Math.min(depth, 4), 50, 50, 34),
    [depth],
  );

  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">跑一下</h2>
        <span className="section-meta">
          depth = {depth}
          {mode === "koch" ? ` · sides = ${sides}` : ""}
        </span>
      </div>

      <div className="card card-pad">
        <div className="snow-controls">
          <label className="snow-control">
            <span className="field-label">迭代深度 n</span>
            <input
              type="range"
              min={0}
              max={5}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
            />
          </label>
          {mode === "koch" ? (
            <label className="snow-control">
              <span className="field-label">基底边数（角度数）</span>
              <input
                type="range"
                min={3}
                max={8}
                value={sides}
                onChange={(e) => setSides(Number(e.target.value))}
              />
              <span className="section-meta" style={{ marginTop: 4, display: "block" }}>
                {sides === 3
                  ? "3 = 经典三角 Koch（当前 logo）"
                  : sides === 6
                    ? "6 = 六角雪花"
                    : `${sides} 边形基底`}
              </span>
            </label>
          ) : null}
          <div className="theme-switch" role="group" aria-label="雪花类型">
            <button
              type="button"
              className={`theme-switch-btn${mode === "koch" ? " active" : ""}`}
              onClick={() => setMode("koch")}
            >
              Koch
            </button>
            <button
              type="button"
              className={`theme-switch-btn${mode === "crystal" ? " active" : ""}`}
              onClick={() => setMode("crystal")}
            >
              六重晶体
            </button>
          </div>
        </div>

        <div className="snow-canvas-wrap">
          <svg viewBox="0 0 100 100" className="snow-canvas" aria-label="雪花图形">
            {mode === "koch" ? (
              <path
                d={kochPath}
                fill="none"
                stroke="var(--accent-fg)"
                strokeWidth="1.3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : (
              crystal.map(([a, b], i) => (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="var(--accent-fg)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              ))
            )}
          </svg>
        </div>

        <p className="item-body">
          {mode === "koch"
            ? `科赫雪花：正 ${sides} 边形每条边上反复「中间折 60° 尖角」。导航 logo 为 sides=3（候选 C）。`
            : "六重对称晶体：从中心六条主枝，每层再分叉 —— 径向结构。"}
        </p>

        <pre className="code-block">{`// 经典科赫雪花（三角 · 候选 C）
function Koch(segment, n):
  if n == 0: draw(segment)
  else:
    (A, P1, Peak, P2, B) = split_and_peak(segment)  // 外向 60°
    Koch(A→P1, n-1); Koch(P1→Peak, n-1)
    Koch(Peak→P2, n-1); Koch(P2→B, n-1)

// 基底：等边三角形 3 条边
Tri = regularPolygon(sides=3)
KochSnowflake(n) = Σ Koch(边ᵢ, n)  for i = 1..3`}</pre>
      </div>
    </section>
  );
}
