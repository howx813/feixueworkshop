"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimCanvas, usePalette, type DrawFn } from "./demokit";
import {
  detectPitch,
  freqToNote,
  midiToFreq,
  midiToLabel,
  type NoteInfo,
} from "@/lib/pitch";

/* ------------------------------------------------------------------ */
/* 音频引擎：一个共享 AudioContext + Analyser，麦克风与发生器都接进来      */
/* ------------------------------------------------------------------ */

type MicState = "idle" | "requesting" | "on" | "unavailable";

type Engine = {
  micState: MicState;
  micError: string | null;
  enableMic: () => void;
  stopMic: () => void;
  tone: { freq: number; type: OscillatorType } | null;
  startTone: (freq: number, type: OscillatorType) => void;
  stopTone: () => void;
  getAnalyser: () => AnalyserNode | null;
  getSampleRate: () => number;
};

function useAudioEngine(): Engine {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micSrcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const [micState, setMicState] = useState<MicState>("idle");
  const [micError, setMicError] = useState<string | null>(null);
  const [tone, setTone] = useState<Engine["tone"]>(null);

  const ensureGraph = useCallback(() => {
    if (ctxRef.current && analyserRef.current) {
      return { ctx: ctxRef.current, analyser: analyserRef.current };
    }
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.55;
    ctxRef.current = ctx;
    analyserRef.current = analyser;
    return { ctx, analyser };
  }, []);

  const enableMic = useCallback(async () => {
    setMicState("requesting");
    setMicError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("浏览器不支持麦克风，或页面不在 HTTPS/localhost 下");
      }
      const g = ensureGraph();
      if (!g) throw new Error("AudioContext 不可用");
      await g.ctx.resume();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      const src = g.ctx.createMediaStreamSource(stream);
      src.connect(g.analyser); // 不接 destination，避免回授
      micSrcRef.current = src;
      setMicState("on");
    } catch (e) {
      setMicError(e instanceof Error ? e.message : String(e));
      setMicState("unavailable");
    }
  }, [ensureGraph]);

  const stopMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    micSrcRef.current?.disconnect();
    micSrcRef.current = null;
    setMicState("idle");
  }, []);

  const startTone = useCallback(
    (freq: number, type: OscillatorType) => {
      const g = ensureGraph();
      if (!g) return;
      void g.ctx.resume();
      if (oscRef.current && gainRef.current) {
        oscRef.current.frequency.setTargetAtTime(freq, g.ctx.currentTime, 0.02);
        oscRef.current.type = type;
      } else {
        const osc = g.ctx.createOscillator();
        const gain = g.ctx.createGain();
        gain.gain.value = 0;
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(g.analyser);
        gain.connect(g.ctx.destination);
        osc.start();
        gain.gain.setTargetAtTime(0.12, g.ctx.currentTime, 0.03);
        oscRef.current = osc;
        gainRef.current = gain;
      }
      setTone({ freq, type });
    },
    [ensureGraph],
  );

  const stopTone = useCallback(() => {
    const osc = oscRef.current;
    const gain = gainRef.current;
    const ctx = ctxRef.current;
    oscRef.current = null;
    gainRef.current = null;
    if (osc && gain && ctx) {
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      window.setTimeout(() => {
        try {
          osc.stop();
        } catch {
          /* already stopped */
        }
        osc.disconnect();
        gain.disconnect();
      }, 200);
    }
    setTone(null);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      try {
        oscRef.current?.stop();
      } catch {
        /* ignore */
      }
      void ctxRef.current?.close();
    };
  }, []);

  const getAnalyser = useCallback(() => analyserRef.current, []);
  const getSampleRate = useCallback(
    () => ctxRef.current?.sampleRate ?? 48000,
    [],
  );

  return {
    micState,
    micError,
    enableMic: () => void enableMic(),
    stopMic,
    tone,
    startTone,
    stopTone,
    getAnalyser,
    getSampleRate,
  };
}

const EngineCtx = createContext<Engine | null>(null);

export function SpectrumRoot({ children }: { children: React.ReactNode }) {
  const engine = useAudioEngine();
  return <EngineCtx.Provider value={engine}>{children}</EngineCtx.Provider>;
}

function useEngine(): Engine {
  const e = useContext(EngineCtx);
  if (!e) throw new Error("useEngine 必须在 SpectrumRoot 内使用");
  return e;
}

/* ------------------------------------------------------------------ */
/* 共用：占位提示                                                        */
/* ------------------------------------------------------------------ */

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  w: number,
  y: number,
  textColor: string,
  msg: string,
) {
  ctx.fillStyle = textColor;
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(msg, w / 2, y);
  ctx.textAlign = "left";
}

/* ------------------------------------------------------------------ */
/* 仪器①：示波器 + 频谱柱（时域⇄频域双视图）                              */
/* ------------------------------------------------------------------ */

export function ScopeSpectrum() {
  const palette = usePalette();
  const engine = useEngine();
  const timeBufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const freqBufRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const draw: DrawFn = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const split = h * 0.52;
    const an = engine.getAnalyser();

    // 分隔线与标签
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, split);
    ctx.lineTo(w, split);
    ctx.stroke();
    ctx.fillStyle = palette.text;
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText("时域 · 空气怎么振", 8, 16);
    ctx.fillText("频域 · 由哪些频率组成（对数轴）", 8, split + 16);

    if (!an) {
      drawPlaceholder(
        ctx,
        w,
        split / 2 + 10,
        palette.text,
        "先启用麦克风，或点下方「纯音发生器」",
      );
      return;
    }

    let tbuf = timeBufRef.current;
    if (!tbuf || tbuf.length !== an.fftSize) {
      tbuf = new Float32Array(an.fftSize);
      timeBufRef.current = tbuf;
    }
    let fbuf = freqBufRef.current;
    if (!fbuf || fbuf.length !== an.frequencyBinCount) {
      fbuf = new Uint8Array(an.frequencyBinCount);
      freqBufRef.current = fbuf;
    }

    // 时域
    an.getFloatTimeDomainData(tbuf);
    const midY = split / 2 + 8;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.strokeStyle = palette.grid;
    ctx.stroke();
    ctx.beginPath();
    const step = Math.max(1, Math.floor(tbuf.length / w));
    for (let i = 0, x = 0; i < tbuf.length && x <= w; i += step, x++) {
      const y = midY - tbuf[i] * split * 0.42;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 频域（对数轴）
    an.getByteFrequencyData(fbuf);
    const sr = engine.getSampleRate();
    const binHz = sr / an.fftSize;
    const fMin = 50;
    const fMax = Math.min(sr / 2, 12000);
    const base = h - 8;
    const top = split + 26;

    const fToX = (f: number) =>
      (Math.log(f / fMin) / Math.log(fMax / fMin)) * w;

    // 刻度线
    ctx.strokeStyle = palette.grid;
    ctx.fillStyle = palette.text;
    ctx.font = "9px system-ui, sans-serif";
    for (const f of [100, 1000, 10000]) {
      if (f > fMax) continue;
      const x = fToX(f);
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, base);
      ctx.stroke();
      ctx.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, x + 3, top + 9);
    }

    ctx.fillStyle = palette.accent;
    for (let x = 0; x < w; x++) {
      const f = fMin * Math.pow(fMax / fMin, x / w);
      const bin = Math.min(fbuf.length - 1, Math.round(f / binHz));
      const v = fbuf[bin] / 255;
      const bh = v * (base - top);
      if (bh > 0.5) ctx.fillRect(x, base - bh, 1, bh);
    }
  };

  return (
    <div className="card card-pad">
      <AnimCanvas
        draw={draw}
        height={340}
        label="麦克风声音的时域波形与频谱"
      />
      <p className="item-body" style={{ marginTop: 10 }}>
        说「啊——」：上面是一条抖动的曲线，下面立起一排柱子；
        最左边那根最高的，往往就是你的基音。
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 仪器②：瀑布频谱图（时间往下流的彩虹河）                                 */
/* ------------------------------------------------------------------ */

export function Spectrogram() {
  const engine = useEngine();
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const freqBufRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const draw: DrawFn = (ctx, w, h) => {
    // 仪器面板风格：始终深色屏
    ctx.fillStyle = "#0d1319";
    ctx.fillRect(0, 0, w, h);
    const an = engine.getAnalyser();

    if (!an) {
      drawPlaceholder(
        ctx,
        w,
        h / 2,
        "#98a2b3",
        "启用麦克风后，这里会流下一条彩虹河",
      );
      return;
    }

    const iw = Math.max(1, Math.round(w));
    const ih = Math.max(1, Math.round(h));
    if (!offRef.current || offRef.current.width !== iw || offRef.current.height !== ih) {
      const off = document.createElement("canvas");
      off.width = iw;
      off.height = ih;
      const octx = off.getContext("2d");
      if (octx) {
        octx.fillStyle = "#0d1319";
        octx.fillRect(0, 0, iw, ih);
      }
      offRef.current = off;
    }
    const off = offRef.current;
    const octx = off.getContext("2d");
    if (!octx) return;

    let fbuf = freqBufRef.current;
    if (!fbuf || fbuf.length !== an.frequencyBinCount) {
      fbuf = new Uint8Array(an.frequencyBinCount);
      freqBufRef.current = fbuf;
    }
    an.getByteFrequencyData(fbuf);

    // 整体下移 2px，顶部画最新一行
    const dy = 2;
    octx.drawImage(off, 0, 0, iw, ih - dy, 0, dy, iw, ih - dy);

    const sr = engine.getSampleRate();
    const binHz = sr / an.fftSize;
    const fMin = 50;
    const fMax = Math.min(sr / 2, 12000);
    for (let x = 0; x < iw; x++) {
      const f = fMin * Math.pow(fMax / fMin, x / iw);
      const bin = Math.min(fbuf.length - 1, Math.round(f / binHz));
      const t = fbuf[bin] / 255;
      const hue = 255 - 255 * t; // 紫 → 红
      const light = 6 + 52 * Math.pow(t, 1.3);
      octx.fillStyle = `hsl(${hue} 85% ${light}%)`;
      octx.fillRect(x, 0, 1, dy);
    }

    ctx.drawImage(off, 0, 0, w, h);

    // 刻度
    ctx.fillStyle = "rgba(232,235,242,0.65)";
    ctx.font = "9px system-ui, sans-serif";
    const fToX = (f: number) =>
      (Math.log(f / fMin) / Math.log(fMax / fMin)) * w;
    for (const f of [100, 1000, 10000]) {
      if (f > fMax) continue;
      ctx.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, fToX(f) + 2, h - 6);
    }
    ctx.fillText("↓ 时间流", 6, 14);
  };

  return (
    <div className="card card-pad">
      <AnimCanvas
        draw={draw}
        height={260}
        label="瀑布频谱图：频率横轴，时间纵轴"
      />
      <p className="item-body" style={{ marginTop: 10 }}>
        横轴是频率，纵轴是时间，颜色越红越响。吹一声口哨滑音，
        看那条亮线画出一道彩虹滑梯——这就是听歌识曲在看的「指纹」。
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 仪器③：音高表（音名 + 音分指针）                                       */
/* ------------------------------------------------------------------ */

type HeldNote = NoteInfo & { freq: number; at: number };

export function PitchMeter() {
  const palette = usePalette();
  const engine = useEngine();
  const timeBufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const holdRef = useRef<HeldNote | null>(null);

  const draw: DrawFn = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const an = engine.getAnalyser();

    if (!an) {
      drawPlaceholder(
        ctx,
        w,
        h / 2,
        palette.text,
        "启用麦克风后，哼一声，我告诉你音名",
      );
      return;
    }

    let tbuf = timeBufRef.current;
    if (!tbuf || tbuf.length !== an.fftSize) {
      tbuf = new Float32Array(an.fftSize);
      timeBufRef.current = tbuf;
    }
    an.getFloatTimeDomainData(tbuf);
    const r = detectPitch(tbuf, engine.getSampleRate());
    if (r) {
      holdRef.current = { ...freqToNote(r.freq), freq: r.freq, at: performance.now() };
    }

    const held = holdRef.current;
    const fresh = held !== null && performance.now() - held.at < 600;

    const cx = w / 2;
    const cy = h * 0.66;

    if (!held || !fresh) {
      drawPlaceholder(ctx, w, cy, palette.text, "听不清……哼一声长音试试");
      holdRef.current = fresh ? held : null;
    } else {
      const dim = r ? 1 : 0.45;
      // 音名大字
      ctx.globalAlpha = dim;
      ctx.fillStyle = palette.accent;
      ctx.font = "700 44px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${held.name}${held.octave}`, cx, h * 0.38);
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillStyle = palette.text;
      ctx.fillText(`${held.freq.toFixed(1)} Hz`, cx, h * 0.38 + 20);
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;

      // 音分表盘：-50 … +50
      const half = Math.min(w * 0.38, 180);
      const cents = Math.max(-50, Math.min(50, held.cents));
      const nx = cx + (cents / 50) * half;
      const color =
        Math.abs(cents) <= 5
          ? palette.emerald
          : Math.abs(cents) <= 20
            ? palette.amber
            : palette.rose;

      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - half, cy);
      ctx.lineTo(cx + half, cy);
      ctx.stroke();
      ctx.fillStyle = palette.text;
      ctx.font = "9px system-ui, sans-serif";
      ctx.textAlign = "center";
      for (const c of [-50, -25, 0, 25, 50]) {
        const tx = cx + (c / 50) * half;
        ctx.beginPath();
        ctx.moveTo(tx, cy - 4);
        ctx.lineTo(tx, cy + 4);
        ctx.stroke();
        ctx.fillText(c === 0 ? "准" : `${c > 0 ? "+" : ""}${c}`, tx, cy + 16);
      }
      // 指针
      ctx.globalAlpha = dim;
      ctx.beginPath();
      ctx.arc(nx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText(
        Math.abs(cents) <= 5
          ? "准！"
          : cents > 0
            ? `偏高 ${cents} 音分`
            : `偏低 ${-cents} 音分`,
        cx,
        cy + 34,
      );
      ctx.textAlign = "left";
    }
  };

  return (
    <div className="card card-pad">
      <AnimCanvas draw={draw} height={200} label="音高表：显示音名与音分偏移" />
      <p className="item-body" style={{ marginTop: 10 }}>
        它做的是调音器做的事：在波形里找「每隔多久重复一次」（自相关），
        倒数就是基频，再换算成音名。指针偏左是唱低了，偏右是唱高了。
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 仪器④：纯音发生器 + 钢琴小键盘                                         */
/* ------------------------------------------------------------------ */

type WaveChoice = "sine" | "square" | "sawtooth" | "triangle";

const WAVE_LABEL: Record<WaveChoice, string> = {
  sine: "正弦",
  square: "方波",
  sawtooth: "锯齿",
  triangle: "三角",
};

const KEY_MIN = 60; // C4
const KEY_MAX = 83; // B5
const BLACK_AFTER = new Set([0, 2, 5, 7, 9]); // C D F G A 后面的黑键
const WHITE_PC = new Set([0, 2, 4, 5, 7, 9, 11]); // 白键音级

function isNatural(midi: number): boolean {
  return WHITE_PC.has(((midi % 12) + 12) % 12);
}

export function ToneLab() {
  const engine = useEngine();
  const [wave, setWave] = useState<WaveChoice>("sine");
  const [freq, setFreq] = useState(440);
  const [pressed, setPressed] = useState<number | null>(null);

  const running = engine.tone !== null;
  const sliderVal = Math.round(
    (100 * Math.log(freq / 20)) / Math.log(8000 / 20),
  );
  const note = freqToNote(freq);

  const applyTone = (f: number, wv: WaveChoice) => {
    engine.startTone(f, wv);
  };

  const toggle = () => {
    if (running) engine.stopTone();
    else applyTone(freq, wave);
  };

  const whites: number[] = [];
  for (let m = KEY_MIN; m <= KEY_MAX; m++) if (isNatural(m)) whites.push(m);
  const whiteW = 100 / whites.length;
  const blacks: { midi: number; left: number }[] = [];
  whites.forEach((m, i) => {
    const pc = ((m % 12) + 12) % 12;
    if (BLACK_AFTER.has(pc) && m + 1 <= KEY_MAX) {
      blacks.push({ midi: m + 1, left: (i + 1) * whiteW });
    }
  });

  const keyDown = (m: number) => {
    setPressed(m);
    applyTone(midiToFreq(m), wave);
  };
  const keyUp = () => {
    setPressed(null);
    engine.stopTone();
  };

  return (
    <div className="card card-pad">
      <div className="snow-controls">
        <div className="theme-switch" role="group" aria-label="波形">
          {(Object.keys(WAVE_LABEL) as WaveChoice[]).map((wv) => (
            <button
              key={wv}
              type="button"
              className={`theme-switch-btn${wave === wv ? " active" : ""}`}
              onClick={() => {
                setWave(wv);
                if (running) applyTone(freq, wv);
              }}
            >
              {WAVE_LABEL[wv]}
            </button>
          ))}
        </div>
        <label className="snow-control">
          <span className="field-label">
            频率：{freq} Hz ≈ {note.name}
            {note.octave}
            {note.cents !== 0
              ? `（${note.cents > 0 ? "+" : ""}${note.cents} 音分）`
              : ""}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderVal}
            onChange={(e) => {
              const f = Math.round(
                20 * Math.pow(400, Number(e.target.value) / 100),
              );
              setFreq(f);
              if (running) applyTone(f, wave);
            }}
          />
        </label>
        <button
          type="button"
          className={`btn ${running ? "btn-ghost" : "btn-primary"}`}
          onClick={toggle}
        >
          {running ? "■ 停止" : "▶ 发声"}
        </button>
      </div>

      {/* 钢琴键盘 C4–B5 */}
      <div
        style={{
          position: "relative",
          height: 130,
          marginTop: 14,
          userSelect: "none",
          touchAction: "none",
        }}
      >
        <div style={{ display: "flex", height: "100%", gap: 2 }}>
          {whites.map((m) => (
            <button
              key={m}
              type="button"
              aria-label={midiToLabel(m)}
              onPointerDown={() => keyDown(m)}
              onPointerUp={keyUp}
              onPointerLeave={() => {
                if (pressed === m) keyUp();
              }}
              style={{
                flex: 1,
                border: "1px solid var(--border-strong)",
                borderRadius: "0 0 6px 6px",
                background:
                  pressed === m ? "var(--accent-weak)" : "var(--bg-1)",
                color: "var(--text-2)",
                fontSize: 9,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 6,
                cursor: "pointer",
              }}
            >
              {m % 12 === 0 ? midiToLabel(m) : ""}
            </button>
          ))}
        </div>
        {blacks.map(({ midi, left }) => (
          <button
            key={midi}
            type="button"
            aria-label={midiToLabel(midi)}
            onPointerDown={() => keyDown(midi)}
            onPointerUp={keyUp}
            onPointerLeave={() => {
              if (pressed === midi) keyUp();
            }}
            style={{
              position: "absolute",
              top: 0,
              left: `calc(${left}% - ${whiteW * 0.31}%)`,
              width: `${whiteW * 0.62}%`,
              height: "58%",
              border: "1px solid var(--border-strong)",
              borderRadius: "0 0 5px 5px",
              background:
                pressed === midi ? "var(--accent)" : "var(--bg-2)",
              cursor: "pointer",
              zIndex: 1,
            }}
          />
        ))}
      </div>

      <p className="item-body" style={{ marginTop: 10 }}>
        按住琴键发声，眼睛盯住上面的频谱和音高表：弹 A4，柱子应该立在 440，
        音高表说出「A4」——自己发的声，自己验证。再切到方波，
        看 3 倍、5 倍频率上冒出来的柱子，那就是傅里叶页讲过的谐波。
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 麦克风引导卡                                                          */
/* ------------------------------------------------------------------ */

export function MicGate() {
  const engine = useEngine();
  const { micState, micError } = engine;

  return (
    <div className="card card-pad">
      <h2 className="item-title" style={{ marginTop: 0 }}>
        第一步：让显微镜看到声音
      </h2>
      <p className="item-body">
        所有分析都在你的浏览器里实时完成，声音
        <strong>不出这台设备、不联网、不录音</strong>。
      </p>
      {micState === "idle" && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={engine.enableMic}
        >
          🎙 启用麦克风
        </button>
      )}
      {micState === "requesting" && (
        <p className="item-body" style={{ margin: 0 }}>
          正在请求麦克风权限……（浏览器会弹窗问你）
        </p>
      )}
      {micState === "on" && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="chip chip-accent">麦克风已开启</span>
          <button type="button" className="btn btn-ghost" onClick={engine.stopMic}>
            关闭麦克风
          </button>
        </div>
      )}
      {micState === "unavailable" && (
        <p className="item-body" style={{ margin: 0 }}>
          麦克风不可用（{micError}）。没关系——往下翻，
          <strong>纯音发生器</strong>照样能驱动全部四件仪器。
        </p>
      )}
    </div>
  );
}
