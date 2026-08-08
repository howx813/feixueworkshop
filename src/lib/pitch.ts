/**
 * 音高识别纯函数库（频谱显微镜）
 * 与 scripts/test-pitch.mjs 的内联逻辑保持一致。
 */

export type PitchResult = {
  /** 基频 Hz */
  freq: number;
  /** 清晰度 0–1（自相关峰值强度） */
  clarity: number;
};

export type NoteInfo = {
  /** MIDI 音符号（A4 = 69） */
  midi: number;
  /** 音名，如 "A" / "C#" */
  name: string;
  /** 八度（A4 的 octave = 4） */
  octave: number;
  /** 相对最近音名的音分偏移（-50 … +50） */
  cents: number;
};

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

/** 可识别的频率范围（人声 + 口哨 + 常见乐器基音） */
const MIN_FREQ = 60;
const MAX_FREQ = 1200;
/** RMS 低于该值视为「没在响」 */
const RMS_GATE = 0.01;
/** 自相关峰值低于该值视为「音高不清晰」 */
const CLARITY_GATE = 0.55;

/**
 * 归一化自相关估基频。
 * 输入一段时域采样（通常 analyser.fftSize 个），返回基频或 null。
 */
export function detectPitch(
  samples: Float32Array,
  sampleRate: number,
): PitchResult | null {
  const size = samples.length;

  let rms = 0;
  for (let i = 0; i < size; i++) rms += samples[i] * samples[i];
  rms = Math.sqrt(rms / size);
  if (rms < RMS_GATE) return null;

  const minLag = Math.max(2, Math.floor(sampleRate / MAX_FREQ));
  const maxLag = Math.min(Math.floor(sampleRate / MIN_FREQ), size - 2);

  let r0 = 0;
  for (let i = 0; i < size - maxLag; i++) r0 += samples[i] * samples[i];
  if (r0 <= 0) return null;

  // 全 lag 相关曲线
  const vals = new Float64Array(maxLag + 1);
  let globalMax = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let r = 0;
    for (let i = 0; i < size - maxLag; i++) r += samples[i] * samples[i + lag];
    const v = r / r0;
    vals[lag] = v;
    if (v > globalMax) globalMax = v;
  }
  if (globalMax < CLARITY_GATE) return null;

  // 取「第一个足够强的局部峰」，避免 2T、3T 处的八度误判
  let bestLag = -1;
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (
      vals[lag] >= 0.9 * globalMax &&
      vals[lag] > vals[lag - 1] &&
      vals[lag] >= vals[lag + 1]
    ) {
      bestLag = lag;
      break;
    }
  }
  if (bestLag < 0) return null;
  const bestVal = vals[bestLag];

  // 抛物线插值，亚采样精度
  const corrAt = (lag: number) => {
    let r = 0;
    for (let i = 0; i < size - maxLag; i++) r += samples[i] * samples[i + lag];
    return r / r0;
  };
  const y0 = corrAt(bestLag - 1);
  const y1 = bestVal;
  const y2 = corrAt(bestLag + 1);
  const denom = y0 - 2 * y1 + y2;
  const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
  const lag = bestLag + Math.max(-0.5, Math.min(0.5, shift));

  return { freq: sampleRate / lag, clarity: bestVal };
}

/** 频率 → 最近音名与音分偏移 */
export function freqToNote(freq: number): NoteInfo {
  const exact = 69 + 12 * Math.log2(freq / 440);
  const midi = Math.round(exact);
  const cents = Math.round((exact - midi) * 100);
  return {
    midi,
    name: NOTE_NAMES[((midi % 12) + 12) % 12],
    octave: Math.floor(midi / 12) - 1,
    cents,
  };
}

/** MIDI 音符号 → 频率 */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** MIDI 音符号 → 显示名（如 "A4"） */
export function midiToLabel(midi: number): string {
  const n = freqToNote(midiToFreq(midi));
  return `${n.name}${n.octave}`;
}
