# 频谱显微镜 · 设计文档

日期：2026-08-08
状态：已获用户批准（对话中逐节确认）
目标版本：0.2.32

## 背景与定位

继 `/lab/fourier/`（傅里叶变换动画解说）之后的姊妹篇。傅里叶页讲「为什么」，
频谱显微镜给「马上能玩」：打开麦克风，实时看到自己声音的时域波形、频谱、
瀑布图和音高——把刚学的概念立刻在自己嗓子上验证一遍。两页互跳导流。

## 页面结构

路由 `/lab/spectrum/`，标题「频谱显微镜」，副标题「给你的声音照个 X 光」。
做法一「仪器面板长页」：一页下滚，每个仪器一张卡片，穿插解说词卡片
（沿用傅里叶页的 Narration + 浏览器 TTS 朗读）。

1. 引导卡：麦克风授权（本地处理、不上传说明）
2. 仪器①：示波器 + 频谱柱（对数频率轴，标 100 / 1k / 10k）
3. 仪器②：瀑布频谱图（时间下滚，彩虹色映射）
4. 仪器③：音高表（音名 + 频率 + 音分偏移表盘；不清晰时显示「听不清」）
5. 仪器④：纯音发生器（4 种波形 + 对数频率滑杆 20–8000Hz）+ 钢琴小键盘（C4–B5）
6. 原理收尾解说（实时 FFT）+ 现实用途（调音器 / 听歌识曲 / 声纹）
7. 「试试看」三个小挑战彩蛋
8. 回宝匣 + 傅里叶页互跳链接

## 音频管线

- `useAudioEngine()` hook：一个共享 AudioContext + 一个 AnalyserNode
  （fftSize 4096，smoothing 0.6）。
- 麦克风：`getUserMedia` → MediaStreamSource → Analyser（不接 destination，避免回授）。
- 发生器：OscillatorNode → GainNode → 同时接 Analyser 和 destination。
  **发生器与麦克风共用同一 Analyser**——麦克风不可用时全部仪器照常可玩
  （内置音源模式）；麦克风可用时可自发声并在频谱上验证。
- 卸载清理：停 mic 轨道、停 osc、关闭 AudioContext。
- iOS Safari：AudioContext 在用户手势（启用按钮）内创建/resume。

## 权限与兜底

- 首进页面不请求权限，显示引导卡，点击「启用麦克风」才请求。
- 拒绝 / 无设备 / 非 HTTPS：不报错不空白，banner 提示 + 自动内置音源模式。

## 音高识别

- `src/lib/pitch.ts` 纯函数：
  - `detectPitch(samples, sampleRate)`：RMS 门限 → 归一化自相关（60–1200Hz
    lag 范围）→ 峰值清晰度门限 → 抛物线插值 → `{ freq, clarity } | null`
  - `freqToNote(freq)` → `{ midi, name, octave, cents }`；`midiToFreq(midi)`
- 单测 `scripts/test-pitch.mjs`：按项目惯例内联同逻辑（参照 test-gravity.mjs），
  合成 440Hz / 261.6Hz 正弦验证基频、音名、音分；挂进 `test:unit`。

## 工程事项

- 抽取共享 `src/components/demokit.tsx`：usePalette / AnimCanvas /
  SpeakButton / Narration；FourierDemo 与傅里叶页改为从 demokit 引入。
- 新组件 `src/components/SpectrumDemo.tsx`（音频引擎 + 四仪器 + 键盘）。
- 注册：lab.ts 顶部条目、LabIcon 新增 `spectrum`（信号柱图标）、
  changelog 顶 `0.2.32`、predeploy-check 页面清单加 `lab/spectrum/index.html`。
- 已知限制：实际手感（麦克风、瀑布、iPhone）需部署后浏览器实测，终端只能
  验证构建与纯逻辑。

## 发版流程（固定）

lint → `npm run test:predeploy` → commit + push → `npm run deploy`（打 `v0.2.32`）。
