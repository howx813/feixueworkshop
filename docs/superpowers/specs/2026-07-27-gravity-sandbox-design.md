# 引力沙盘（/lab/gravity/）设计文档

- 日期：2026-07-27
- 目标版本：v0.2.17
- 状态：设计已确认，待实现

## 背景与定位

飞雪工坊「手搓宝匣」新增实验。一句话：一道从左向右的"粒子风"，鼠标放下的质量点像引力透镜一样把流线掰弯。定位与宝匣其他实验一致——不求完整，只求好玩、能点开，单文件自包含。

已确认的交互约束：

- 点击空白放质点，按住拖动，双击删除
- 「吸引 / 排斥」切换按钮决定下一个点的类型
- 滑杆：引力强度、风速、粒子数

## 技术方案（已选定：方案 A 连续介质流）

粒子不做 N 体模拟，而是处于持续风场中；质量点对粒子施加引力/斥力偏折。

- 每帧每粒子计算量 = O(质点数)，质点上限 5 个，3000 粒子可稳 60fps
- 否决的备选：B 纯 N 体（粒子迅速被吞并，玩法重心偏移）；C 网格势场（交互响应延迟、实现重）

## 架构与文件

| 文件 | 职责 |
|------|------|
| `src/lib/gravity-core.ts` | 纯物理核心：风场+引力合成加速度、软化半径防奇点、质点 FIFO、粒子重生位置。无 DOM，可单测 |
| `src/components/GravitySandbox.tsx` | Canvas 渲染、指针交互、控制条；全部状态组件内持有 |
| `src/app/lab/gravity/page.tsx` | 薄页面：kicker/标题/简介/返回链接，照抄 `lab/particles/page.tsx` 结构 |
| `src/data/lab.ts` | 清单顶部加 `gravity` 条目（icon: `"gravity"`，status: 可玩） |
| `src/components/LabIcon.tsx` | 新增 `gravity` 图标：轨道环 + 核心点；`LabItem["icon"]` 联合类型同步扩展 |
| `scripts/test-gravity.mjs` | 物理核心单测；`package.json` 的 `test:unit` 串联 |
| `src/data/changelog.ts` | 顶部追加 v0.2.17 |

## 模拟核心

### 数据模型

```ts
type Mass = { x: number; y: number; m: number; kind: "attract" | "repel" };
type Particle = { x: number; y: number; vx: number; vy: number };
```

### 每帧更新

1. 风场基础速度向右，叠加按 y 的正弦扰动（流线自然起伏）：
   `wind(x, y) = (windSpeed, windSpeed * 0.35 * sin(y * 0.01 + t * 0.5))`
2. 引力合成（软化半径 `SOFT = 12` 防奇点）：
   `a = Σ sign(kind) * G * m * d̂ / max(r², SOFT²)`
3. 速度积分：`v += a·dt`，并做阻尼上限（`|v| ≤ vmax`，防止贴核粒子无限加速）
4. 位置积分 `p += v·dt`
5. 粒子飞出画布任意边界（斥力点可能把粒子推回左侧），或与质点距离 < 质点核心半径（约 6px）→ 从左缘随机高度重生

### 常数（默认值，均可由滑杆调）

| 参数 | 默认 | 范围 |
|------|------|------|
| 引力强度 G | 4000 | 0–12000 |
| 风速 windSpeed | 60 px/s | 0–200 |
| 粒子数 | 3000 | 500–4000 |
| 质点上限 | 5 | 固定，超出 FIFO 淘汰最旧 |
| 质点质量 m | 1（固定） | — |

### 渲染

- Canvas 2D，DPR 感知 resize（`devicePixelRatio` 缩放 backing store）
- 拖尾：每帧先 `fillRect` 半透明深色覆盖（alpha ≈ 0.08），再画粒子
- 粒子：沿速度方向画 2–4px 短线段，颜色按速率映射（慢=青蓝 → 快=暖白）
- 质点：辉光核心（radialGradient）+ 细环；吸引=青蓝白，排斥=橙红
- `prefers-reduced-motion`：粒子数砍半

## 交互

- 指针按下：命中已有质点（半径 14px）→ 进入拖动；否则在该处按当前模式放质点
- 指针移动：拖动中更新质点坐标
- 双击质点：删除
- 「吸引/排斥」切换按钮：决定放下一个点的类型
- 「清空」：移除全部质点；「重置」：清空质点并重新撒粒子
- 触屏：单指等同鼠标；画布 `touch-action: none` 防止手势与页面滚动冲突
- 窗口缩放：质点保留，粒子数按新面积比例补/减

## 测试

`scripts/test-gravity.mjs`（挂进 `test:unit`），覆盖纯函数：

1. 合成加速度方向：单一吸引质点右侧的粒子，加速度 x 分量 > 0
2. 软化半径：r→0 时加速度有界，不发散为 NaN/Infinity
3. 斥力符号：repel 质点产生反向加速度
4. FIFO：放第 6 个质点时淘汰最旧
5. 重生：越界粒子重生在左缘、y 在画布高度内

发版走标准流程：changelog v0.2.17 → `test:predeploy` → push → `npm run deploy`。

## 不做（YAGNI）

- 多指触控、质点质量编辑、预设场景（太阳系等）、轨迹线显隐开关、音效
