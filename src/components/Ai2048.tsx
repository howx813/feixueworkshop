"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  emptyBoard,
  move,
  spawn,
  isGameOver,
  hasWon,
  maxTile,
  type Board,
} from "@/lib/game2048";
import { bestMove } from "@/lib/ai2048";

const TILE_STYLES: Record<number, string> = {
  2: "bg-slate-800 text-slate-300",
  4: "bg-slate-700 text-slate-200",
  8: "bg-cyan-900 text-cyan-200",
  16: "bg-cyan-800 text-cyan-100",
  32: "bg-sky-700 text-sky-50",
  64: "bg-sky-500 text-white",
  128: "bg-yellow-700 text-yellow-50",
  256: "bg-amber-600 text-amber-50",
  512: "bg-orange-600 text-orange-50",
  1024: "bg-red-600 text-red-50",
  2048: "bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-[0_0_24px_rgba(245,158,11,0.55)]",
};

function tileClass(v: number): string {
  return (
    TILE_STYLES[v] ??
    "bg-gradient-to-br from-fuchsia-700 to-purple-900 text-white shadow-[0_0_28px_rgba(217,70,239,0.5)]"
  );
}

type Phase = "idle" | "running" | "paused" | "won" | "over";

const SPEEDS = [
  { label: "慢", ms: 320 },
  { label: "中", ms: 160 },
  { label: "快", ms: 80 },
  { label: "极速", ms: 30 },
];

export default function Ai2048() {
  const [board, setBoard] = useState<Board>(() => {
    const b = emptyBoard();
    spawn(b);
    spawn(b);
    return b;
  });
  const [score, setScore] = useState(0);
  const [steps, setSteps] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef({ board, score, steps });
  stateRef.current = { board, score, steps };

  const reset = useCallback(() => {
    const b = emptyBoard();
    spawn(b);
    spawn(b);
    setBoard(b);
    setScore(0);
    setSteps(0);
    setPhase("idle");
  }, []);

  // ---- AI loop ----
  useEffect(() => {
    if (phase !== "running") return;
    const { ms } = SPEEDS[speed];
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const cur = stateRef.current;
      const dir = bestMove(cur.board);
      if (dir === -1 || isGameOver(cur.board)) {
        setPhase("over");
        return;
      }
      const { board: next, gained } = move(cur.board, dir);
      spawn(next);
      setBoard(next);
      setScore(cur.score + gained);
      setSteps(cur.steps + 1);
      if (hasWon(next)) {
        setPhase("won");
        return;
      }
      timerRef.current = setTimeout(tick, ms);
    };

    timerRef.current = setTimeout(tick, ms);
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, speed]);

  // ---- keyboard play (manual mode) ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "idle" && phase !== "paused") return;
      const map: Record<string, number> = {
        ArrowUp: 0,
        ArrowRight: 1,
        ArrowDown: 2,
        ArrowLeft: 3,
      };
      const dir = map[e.key];
      if (dir === undefined) return;
      e.preventDefault();
      const cur = stateRef.current;
      const { board: next, gained, moved } = move(cur.board, dir as 0 | 1 | 2 | 3);
      if (!moved) return;
      spawn(next);
      setBoard(next);
      setScore(cur.score + gained);
      setSteps(cur.steps + 1);
      if (hasWon(next)) setPhase("won");
      else if (isGameOver(next)) setPhase("over");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const statusText: Record<Phase, string> = {
    idle: "待命 · 可手动方向键玩，或交给 AI",
    running: "AI 思考中…",
    paused: "已暂停",
    won: "🏆 AI 打穿 2048！",
    over: "游戏结束",
  };

  return (
    <div className="ai2048-wrap">
      <div className="ai2048-stats">
        <div className="ai2048-stat">
          <span className="ai2048-stat-label">分数</span>
          <span className="ai2048-stat-value">{score}</span>
        </div>
        <div className="ai2048-stat">
          <span className="ai2048-stat-label">步数</span>
          <span className="ai2048-stat-value">{steps}</span>
        </div>
        <div className="ai2048-stat">
          <span className="ai2048-stat-label">最大块</span>
          <span className="ai2048-stat-value">{maxTile(board)}</span>
        </div>
        <div className="ai2048-stat ai2048-stat-status">
          <span className="ai2048-stat-label">状态</span>
          <span className={`ai2048-stat-value ${phase === "running" ? "text-amber-400" : ""}`}>
            {statusText[phase]}
          </span>
        </div>
      </div>

      <div className="ai2048-board">
        {board.map((v, i) => (
          <div key={i} className={`ai2048-cell ${v > 0 ? tileClass(v) : "ai2048-cell-empty"}`}>
            {v > 0 ? v : ""}
          </div>
        ))}
        {(phase === "won" || phase === "over") && (
          <div className="ai2048-overlay">
            <p className="ai2048-overlay-title">{phase === "won" ? "2048 达成" : "无路可走"}</p>
            <p className="ai2048-overlay-sub">
              {phase === "won" ? `用时 ${steps} 步 · 分数 ${score}` : `分数 ${score} · ${steps} 步`}
            </p>
            <button onClick={reset} className="ai2048-btn ai2048-btn-primary">
              再来一局
            </button>
          </div>
        )}
      </div>

      <div className="ai2048-controls">
        {phase === "running" ? (
          <button onClick={() => setPhase("paused")} className="ai2048-btn ai2048-btn-primary">
            暂停 AI
          </button>
        ) : (
          <button
            onClick={() => setPhase("running")}
            disabled={phase === "won" || phase === "over"}
            className="ai2048-btn ai2048-btn-primary"
          >
            ▶ AI 来玩
          </button>
        )}
        <button onClick={reset} className="ai2048-btn">
          重开
        </button>
        <div className="ai2048-speed">
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setSpeed(i)}
              className={`ai2048-speed-btn ${i === speed ? "ai2048-speed-active" : ""}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p className="ai2048-hint">
        expectimax 搜索（深度自适应）· 评估函数：空格 × 单调性 × 平滑度 × 角落权重 ·
        AI 关闭时可用方向键手动玩
      </p>
    </div>
  );
}
