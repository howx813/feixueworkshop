"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyWide,
  circleHitsRect,
  DROP_KINDS,
  type DropKind,
  hitBrick,
  makeBricks,
  MARBLE_H,
  MARBLE_W,
  type Brick,
  clamp,
} from "@/lib/marble-core";

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  fire: boolean;
};

type Drop = {
  x: number;
  y: number;
  vy: number;
  kind: DropKind;
  alive: boolean;
};

type Phase = "ready" | "playing" | "paused" | "won" | "lost";

const W = MARBLE_W;
const H = MARBLE_H;
const PADDLE_H = 12;
const DROP_CHANCE = 0.42;

const DROP_LABEL: Record<DropKind, string> = {
  multi: "多球",
  wide: "加宽",
  sticky: "粘板",
  slow: "慢速",
  fire: "火力",
  life: "生命",
};

const DROP_COLOR: Record<DropKind, string> = {
  multi: "#6cb8c6",
  wide: "#5fc79a",
  sticky: "#d3b26a",
  slow: "#98a2b3",
  fire: "#d86a52",
  life: "#e8ebf2",
};

function randPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function brickColor(b: Brick): string {
  const t = b.hp / b.maxHp;
  if (t > 0.66) return "#4fa3b3";
  if (t > 0.33) return "#d3b26a";
  return "#d86a52";
}

type Hud = {
  score: number;
  lives: number;
  level: number;
  phase: Phase;
  message: string;
};

export function MarbleGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keys = useRef({ left: false, right: false });
  const state = useRef({
    paddleX: W / 2,
    paddleW: 88,
    sticky: false,
    fireUntil: 0,
    balls: [] as Ball[],
    bricks: makeBricks(),
    drops: [] as Drop[],
    attached: true,
    score: 0,
    lives: 3,
    level: 1,
    phase: "ready" as Phase,
    message: "空格发射",
    lastTs: 0,
  });
  const [hud, setHud] = useState<Hud>({
    score: 0,
    lives: 3,
    level: 1,
    phase: "ready",
    message: "空格发射 · ← → 移动",
  });

  const syncHud = useCallback(() => {
    const s = state.current;
    setHud({
      score: s.score,
      lives: s.lives,
      level: s.level,
      phase: s.phase,
      message: s.message,
    });
  }, []);

  const spawnBallOnPaddle = useCallback(() => {
    const s = state.current;
    const r = 7;
    s.balls = [
      {
        x: s.paddleX,
        y: H - 36 - r,
        vx: 0,
        vy: 0,
        r,
        fire: performance.now() < s.fireUntil,
      },
    ];
    s.attached = true;
  }, []);

  const resetLevel = useCallback(
    (keepScore: boolean) => {
      const s = state.current;
      s.bricks = makeBricks();
      s.drops = [];
      s.paddleW = 88;
      s.sticky = false;
      s.fireUntil = 0;
      if (!keepScore) {
        s.score = 0;
        s.lives = 3;
        s.level = 1;
      }
      s.phase = "ready";
      s.message = "空格发射";
      spawnBallOnPaddle();
      syncHud();
    },
    [spawnBallOnPaddle, syncHud],
  );

  const launch = useCallback(() => {
    const s = state.current;
    if (s.phase === "won" || s.phase === "lost") {
      resetLevel(false);
      return;
    }
    if (s.phase === "paused") {
      s.phase = "playing";
      s.message = "";
      syncHud();
      return;
    }
    if (!s.attached) return;
    const ball = s.balls[0];
    if (!ball) return;
    const angle = (-60 - Math.random() * 60) * (Math.PI / 180);
    const speed = 320 + s.level * 12;
    ball.vx = Math.cos(angle) * speed;
    ball.vy = Math.sin(angle) * speed;
    s.attached = false;
    s.phase = "playing";
    s.message = "";
    syncHud();
  }, [resetLevel, syncHud]);

  useEffect(() => {
    resetLevel(false);
  }, [resetLevel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        keys.current.left = down;
        e.preventDefault();
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        keys.current.right = down;
        e.preventDefault();
      }
      if (down && e.code === "Space") {
        e.preventDefault();
        const s = state.current;
        if (s.phase === "playing" && !s.attached) {
          s.phase = "paused";
          s.message = "已暂停 · 空格继续";
          syncHud();
        } else {
          launch();
        }
      }
      if (down && e.code === "KeyR") {
        resetLevel(false);
      }
    };
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [launch, resetLevel, syncHud]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const step = (ts: number) => {
      const s = state.current;
      const dt = s.lastTs ? Math.min(0.033, (ts - s.lastTs) / 1000) : 0;
      s.lastTs = ts;

      // input
      const speed = 420;
      if (keys.current.left) s.paddleX -= speed * dt;
      if (keys.current.right) s.paddleX += speed * dt;
      s.paddleX = clamp(s.paddleX, s.paddleW / 2 + 4, W - s.paddleW / 2 - 4);

      if (s.attached && s.balls[0]) {
        s.balls[0].x = s.paddleX;
        s.balls[0].y = H - 36 - s.balls[0].r;
        s.balls[0].vx = 0;
        s.balls[0].vy = 0;
      }

      if (s.phase === "playing" && !s.attached) {
        // balls
        for (const ball of s.balls) {
          ball.fire = ts < s.fireUntil;
          ball.x += ball.vx * dt;
          ball.y += ball.vy * dt;

          // walls
          if (ball.x - ball.r < 0) {
            ball.x = ball.r;
            ball.vx = Math.abs(ball.vx);
          }
          if (ball.x + ball.r > W) {
            ball.x = W - ball.r;
            ball.vx = -Math.abs(ball.vx);
          }
          if (ball.y - ball.r < 0) {
            ball.y = ball.r;
            ball.vy = Math.abs(ball.vy);
          }

          // paddle
          const py = H - 36;
          if (
            ball.vy > 0 &&
            ball.y + ball.r >= py &&
            ball.y + ball.r <= py + PADDLE_H + 8 &&
            ball.x >= s.paddleX - s.paddleW / 2 - ball.r &&
            ball.x <= s.paddleX + s.paddleW / 2 + ball.r
          ) {
            if (s.sticky) {
              s.attached = true;
              ball.vx = 0;
              ball.vy = 0;
              ball.y = py - ball.r;
              s.message = "粘住了 · 空格再发射";
              s.phase = "ready";
              syncHud();
            } else {
              const hit =
                (ball.x - s.paddleX) / (s.paddleW / 2);
              const angle = (-90 + hit * 55) * (Math.PI / 180);
              const sp = Math.hypot(ball.vx, ball.vy) || 320;
              ball.vx = Math.cos(angle) * sp;
              ball.vy = Math.sin(angle) * sp;
              ball.y = py - ball.r - 0.5;
            }
          }

          // bricks
          for (const b of s.bricks) {
            if (!b.alive) continue;
            if (!circleHitsRect(ball.x, ball.y, ball.r, b)) continue;

            if (!ball.fire) {
              const prevX = ball.x - ball.vx * dt;
              const prevY = ball.y - ball.vy * dt;
              const fromLeft = prevX + ball.r <= b.x;
              const fromRight = prevX - ball.r >= b.x + b.w;
              const fromTop = prevY + ball.r <= b.y;
              const fromBottom = prevY - ball.r >= b.y + b.h;
              if (fromLeft || fromRight) ball.vx *= -1;
              else if (fromTop || fromBottom) ball.vy *= -1;
              else ball.vy *= -1;
            }

            const hit = hitBrick(b, ball.fire);
            s.score += hit.scoreGain;
            if (hit.destroyed && Math.random() < DROP_CHANCE) {
              s.drops.push({
                x: b.x + b.w / 2,
                y: b.y + b.h / 2,
                vy: 110 + Math.random() * 40,
                kind: randPick(DROP_KINDS),
                alive: true,
              });
            }
            syncHud();
            break;
          }
        }

        // cull fallen balls
        s.balls = s.balls.filter((b) => b.y - b.r < H + 20);
        if (s.balls.length === 0) {
          s.lives -= 1;
          if (s.lives <= 0) {
            s.phase = "lost";
            s.message = "游戏结束 · 空格重开 · R 重开";
          } else {
            s.phase = "ready";
            s.message = `还剩 ${s.lives} 命 · 空格发射`;
            spawnBallOnPaddle();
          }
          syncHud();
        }

        // drops
        const py = H - 36;
        for (const d of s.drops) {
          if (!d.alive) continue;
          d.y += d.vy * dt;
          if (d.y > H + 20) {
            d.alive = false;
            continue;
          }
          if (
            d.y >= py - 4 &&
            d.y <= py + PADDLE_H + 10 &&
            d.x >= s.paddleX - s.paddleW / 2 - 8 &&
            d.x <= s.paddleX + s.paddleW / 2 + 8
          ) {
            d.alive = false;
            applyDrop(d.kind, ts);
            s.score += 5;
            syncHud();
          }
        }
        s.drops = s.drops.filter((d) => d.alive);

        // win
        if (s.bricks.every((b) => !b.alive)) {
          s.level += 1;
          s.score += 100;
          s.phase = "ready";
          s.message = `第 ${s.level} 关 · 空格继续`;
          s.bricks = makeBricks();
          // slightly harder bricks already via level speed on launch
          s.drops = [];
          s.paddleW = Math.max(64, s.paddleW - 4);
          spawnBallOnPaddle();
          syncHud();
        }
      }

      // draw
      draw(ctx, ts);
      raf = requestAnimationFrame(step);
    };

    const applyDrop = (kind: DropKind, ts: number) => {
      const s = state.current;
      s.message = `获得：${DROP_LABEL[kind]}`;
      if (kind === "multi") {
        const base = s.balls[0] || {
          x: s.paddleX,
          y: H - 50,
          vx: 0,
          vy: -300,
          r: 7,
          fire: false,
        };
        for (let i = 0; i < 2; i++) {
          const ang = (-40 - i * 50) * (Math.PI / 180);
          const sp = 300;
          s.balls.push({
            x: base.x,
            y: base.y,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp,
            r: 7,
            fire: ts < s.fireUntil,
          });
        }
        s.attached = false;
        s.phase = "playing";
      } else if (kind === "wide") {
        s.paddleW = applyWide(s.paddleW);
      } else if (kind === "sticky") {
        s.sticky = true;
      } else if (kind === "slow") {
        for (const b of s.balls) {
          b.vx *= 0.7;
          b.vy *= 0.7;
        }
      } else if (kind === "fire") {
        s.fireUntil = ts + 8000;
        for (const b of s.balls) b.fire = true;
      } else if (kind === "life") {
        s.lives += 1;
      }
    };

    const draw = (c: CanvasRenderingContext2D, ts: number) => {
      const s = state.current;
      c.clearRect(0, 0, W, H);

      // bg
      c.fillStyle = "#0c1117";
      c.fillRect(0, 0, W, H);
      c.strokeStyle = "rgba(255,255,255,0.06)";
      c.strokeRect(0.5, 0.5, W - 1, H - 1);

      // subtle grid
      c.strokeStyle = "rgba(255,255,255,0.03)";
      c.beginPath();
      for (let x = 0; x < W; x += 24) {
        c.moveTo(x, 0);
        c.lineTo(x, H);
      }
      for (let y = 0; y < H; y += 24) {
        c.moveTo(0, y);
        c.lineTo(W, y);
      }
      c.stroke();

      // bricks
      for (const b of s.bricks) {
        if (!b.alive) continue;
        c.fillStyle = brickColor(b);
        c.beginPath();
        roundRect(c, b.x, b.y, b.w, b.h, 3);
        c.fill();
        c.fillStyle = "rgba(255,255,255,0.12)";
        c.fillRect(b.x + 2, b.y + 2, b.w - 4, 3);
      }

      // drops
      for (const d of s.drops) {
        if (!d.alive) continue;
        c.fillStyle = DROP_COLOR[d.kind];
        c.beginPath();
        roundRect(c, d.x - 14, d.y - 8, 28, 16, 4);
        c.fill();
        c.fillStyle = "#10151c";
        c.font = "bold 9px system-ui,sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(DROP_LABEL[d.kind], d.x, d.y + 0.5);
      }

      // paddle
      const px = s.paddleX - s.paddleW / 2;
      const py = H - 36;
      c.fillStyle = s.sticky ? "#d3b26a" : "#6cb8c6";
      c.beginPath();
      roundRect(c, px, py, s.paddleW, PADDLE_H, 6);
      c.fill();
      if (ts < s.fireUntil) {
        c.strokeStyle = "#d86a52";
        c.lineWidth = 2;
        c.stroke();
      }

      // balls
      for (const ball of s.balls) {
        c.beginPath();
        c.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        c.fillStyle = ball.fire ? "#d86a52" : "#e8ebf2";
        c.fill();
        c.fillStyle = "rgba(255,255,255,0.35)";
        c.beginPath();
        c.arc(ball.x - 2, ball.y - 2, ball.r * 0.35, 0, Math.PI * 2);
        c.fill();
      }

      // overlay message
      if (s.phase !== "playing" || s.message) {
        c.fillStyle = "rgba(10,16,24,0.45)";
        c.fillRect(0, H / 2 - 36, W, 72);
        c.fillStyle = "#e8ebf2";
        c.font = "600 16px system-ui,sans-serif";
        c.textAlign = "center";
        c.fillText(s.message || "空格发射", W / 2, H / 2);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [spawnBallOnPaddle, syncHud]);

  // pointer / touch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const move = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * W;
      state.current.paddleX = clamp(
        x,
        state.current.paddleW / 2 + 4,
        W - state.current.paddleW / 2 - 4,
      );
    };
    const onMouse = (e: MouseEvent) => move(e.clientX);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) move(e.touches[0].clientX);
    };
    const onClick = () => launch();
    canvas.addEventListener("mousemove", onMouse);
    canvas.addEventListener("touchmove", onTouch, { passive: true });
    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("click", onClick);
    };
  }, [launch]);

  return (
    <div className="marble-wrap">
      <div className="marble-hud card card-pad">
        <div className="meta-row">
          <span className="chip chip-accent">分数 {hud.score}</span>
          <span className="chip">生命 {hud.lives}</span>
          <span className="chip chip-amber">关卡 {hud.level}</span>
          <span className="chip">{phaseLabel(hud.phase)}</span>
        </div>
        <p className="item-body" style={{ marginTop: 8, marginBottom: 0 }}>
          {hud.message || "打砖掉道具 · 接住生效"}
        </p>
      </div>

      <div className="marble-stage card">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="marble-canvas"
          aria-label="碎砖弹珠游戏画布"
        />
      </div>

      <div className="marble-actions">
        <button type="button" className="btn btn-primary" onClick={() => launch()}>
          {hud.phase === "lost" || hud.phase === "won" ? "再来一局" : "发射 / 暂停"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => resetLevel(false)}
        >
          重开
        </button>
      </div>

      <div className="card-quiet card-pad" style={{ marginTop: 12 }}>
        <div className="section-title" style={{ fontSize: "0.875rem" }}>
          道具一览
        </div>
        <div className="marble-drops-legend">
          {DROP_KINDS.map((k) => (
            <span key={k} className="chip" style={{ borderColor: DROP_COLOR[k] }}>
              {DROP_LABEL[k]}
            </span>
          ))}
        </div>
        <p className="item-body" style={{ marginTop: 10, marginBottom: 0 }}>
          键盘 ← → / A D 移动挡板，空格发射或暂停，R 重开；也可用鼠标/触摸拖动挡板，点击画布发射。
        </p>
      </div>
    </div>
  );
}

function phaseLabel(p: Phase) {
  switch (p) {
    case "ready":
      return "待发射";
    case "playing":
      return "进行中";
    case "paused":
      return "暂停";
    case "won":
      return "通关";
    case "lost":
      return "结束";
  }
}

function roundRect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}
