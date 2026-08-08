/**
 * 音高识别单测（不启动浏览器）
 * 内联同逻辑，与 src/lib/pitch.ts 保持一致（项目惯例，参照 test-gravity.mjs）。
 */
import assert from "node:assert/strict";

const MIN_FREQ = 60;
const MAX_FREQ = 1200;
const RMS_GATE = 0.01;
const CLARITY_GATE = 0.55;

function detectPitch(samples, sampleRate) {
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

  const corrAt = (lag) => {
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

const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

function freqToNote(freq) {
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

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function sineAt(freq, sampleRate, size, amp = 0.5) {
  const buf = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    buf[i] = amp * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return buf;
}

/* ---------------- 测试 ---------------- */

const SR = 48000;
const N = 4096;

// 1. 440Hz 正弦 → 检出 ≈440，音名 A4，音分 ≈0
{
  const r = detectPitch(sineAt(440, SR, N), SR);
  assert.ok(r, "440Hz 应检出");
  assert.ok(Math.abs(r.freq - 440) < 1.5, `440Hz 检出偏差过大: ${r.freq}`);
  const note = freqToNote(r.freq);
  assert.equal(note.name, "A");
  assert.equal(note.octave, 4);
  assert.ok(Math.abs(note.cents) <= 2, `音分应接近 0: ${note.cents}`);
  console.log(`  ✔ 440Hz → ${r.freq.toFixed(2)}Hz = A4 (${note.cents} cents)`);
}

// 2. 261.63Hz（C4 中央 C）→ 检出 C4
{
  const r = detectPitch(sineAt(261.63, SR, N), SR);
  assert.ok(r, "261.63Hz 应检出");
  assert.ok(Math.abs(r.freq - 261.63) < 1.5, `偏差过大: ${r.freq}`);
  const note = freqToNote(r.freq);
  assert.equal(note.name, "C");
  assert.equal(note.octave, 4);
  console.log(`  ✔ 261.63Hz → ${r.freq.toFixed(2)}Hz = C4`);
}

// 3. 高八度 880Hz（A5）
{
  const r = detectPitch(sineAt(880, SR, N), SR);
  assert.ok(r, "880Hz 应检出");
  const note = freqToNote(r.freq);
  assert.equal(note.name, "A");
  assert.equal(note.octave, 5);
  console.log(`  ✔ 880Hz → ${r.freq.toFixed(2)}Hz = A5`);
}

// 4. 偏高 30 音分的 A4 → cents ≈ +30
{
  const sharp = 440 * Math.pow(2, 30 / 1200);
  const r = detectPitch(sineAt(sharp, SR, N), SR);
  assert.ok(r, "偏高 A4 应检出");
  const note = freqToNote(r.freq);
  assert.equal(note.name, "A");
  assert.ok(note.cents > 20 && note.cents < 40, `音分应 ≈ +30: ${note.cents}`);
  console.log(`  ✔ A4+30c → ${r.freq.toFixed(2)}Hz = A4 (+${note.cents} cents)`);
}

// 5. 静音 → null
{
  const r = detectPitch(new Float32Array(N), SR);
  assert.equal(r, null);
  console.log("  ✔ 静音 → null（不瞎猜）");
}

// 6. 极低音量 → null
{
  const r = detectPitch(sineAt(440, SR, N, 0.003), SR);
  assert.equal(r, null);
  console.log("  ✔ 极低音量 → null（RMS 门限生效）");
}

// 7. midiToFreq 往返
{
  assert.ok(Math.abs(midiToFreq(69) - 440) < 1e-9);
  assert.ok(Math.abs(midiToFreq(60) - 261.6256) < 1e-3);
  const n = freqToNote(midiToFreq(62)); // D4
  assert.equal(n.name, "D");
  assert.equal(n.octave, 4);
  console.log("  ✔ midiToFreq 往返一致（A4=440, C4≈261.63, D4）");
}

console.log("test-pitch: 全部通过");
