# P0 技术设计：标讯从「快照」升级为「商机雷达」

> 状态：v1.2 定稿，**实现中**——M1 ✅（0.2.25）/ M2 ✅（0.2.26 已上线）/ M3 ✅（Hermes cron `ba656058867d` 接管，launchd 停，GHA 禁 schedule）/ M4 周报底座生成器已就绪（`npm run tenders:weekly`），首期时间待飞雪拍板（8/3 链路验证版 vs 8/10 有内容版，DeepSeek 倾向 8/10）。
> 上游讨论：`docs/next-phase-brainstorm.md`（DeepSeek 头脑风暴）、`docs/review-p0-tenders-radar.md`（一审）
> 范围：标讯历史库 + 构建期趋势聚合 + 趋势可视化 + AI 工作日报第一版（含周报）
> 本方案刻意**不引入任何后端**，延续全站 SSG 单点部署架构。

## 修订记录

- **v1.2（终审定稿）**：①agent-activity 补展示链路（双写 + 热刷，同趋势产物模式）；②M3 新增禁用 `tenders-sync.yml` schedule 的显式步骤（改手动触发保留为备用按钮）；③byProfession 明确按「条目×行业出现次数」计并图注口径；④周报行业洞察限定精匹配口径，不与宽口径计数混用；⑤修正历史库年体积估算（约 3 万行 / 10-20 MB）。
- **v1.1**：①编排层改可插拔契约，确定性抓取归 Hermes cron；②历史库改纯事件溯源；③趋势产物双写支持热刷；④三态口径；⑤排期加缓冲；⑥回填降级。

## 0. 设计前提（两轮评审后确认的取舍）

1. **存储选型：JSONL + git**，不用 SQLite / 云开发。
   - 数据量：精匹配明细在 14 天快照窗口内每日重复留痕，日均 ~80 行 + 1 行 meta，年约 3 万行 / 10-20 MB 纯文本，git 无压力。
   - SQLite 在静态站没有运行时载体（浏览器读不了，终归要转 JSON），只会多一层构建转换。
   - git 天然提供版本化、diff、回溯；每日 diff 干净（只新增行），可人工审阅。
2. **查询方式：构建期/同步期预聚合**，不做在线查询。趋势图与工作日报卡片均读聚合产物，运行时热刷模式与现有标讯列表一致。
3. **编排层是可插拔契约**：方案只规定「哪些脚本、按什么顺序、产物在哪」，不绑定具体调度器/运行时。调度归属按「确定性 vs 模型判断」分工（见 §6）。
4. **方向 1 与方向 2 合并交付**：趋势页 + 工作日报上墙是同一个 agent 系统的两个输出口。

## 1. 目标与非目标

### 目标（本 P0 交付后成立的事）

- 每条精匹配标讯有事件留痕，可回答"这条挂了多久""本周新增 vs 在途 vs 已出窗"。
- `/tenders` 页新增趋势区块：近 12 周数量走势（三态）、地域分布、行业（professions）分布、金额分桶、高星项目周榜；**随每日同步热更新，不依赖发版**。
- 每周自动生成「贵州/西南 AI·信息化招标趋势周报」Markdown，落 `docs/weekly-bid-reports/`，可选推飞书。
- `/tenders` 页出现「AI 工作日报」卡片第一版：标讯 agent 最近一次同步的时间、条数、产物链接；**同样热更新**。
- API 故障时页面自动降级为历史趋势 + 「数据截至 X 日」标注，不出现空白板。

### 非目标（明确不做）

- 不做读者自助的交互式历史检索（需要后端才划算，留给未来架构决策）。
- 不引入 CloudBase 云函数 / 云开发。
- 不做中标预测、竞品分析等重算法功能。
- 不改动现有抓取匹配逻辑（QUALS / 星级规则保持稳定，避免一次 PR 改两件事）。
- 不追求回填历史（API 窗口约 14 天，服务端上限未验证；趋势图从 2-3 周积累起步，不阻塞上线；若顺手验证出可回填再单独做）。

## 2. 架构总览

```text
 ┌─────────────────────────── 编排层（可插拔契约）───────────────────────────┐
 │ 确定性链：Hermes cron（复用早报/正高监控成熟链路，含失败告警）              │
 │   daily → sync → aggregate → commit/push                                │
 │ 模型链：周报生成（Hermes cron 挂 agent 或 Kimi Work 定时任务，飞雪择一）    │
 └────────────────────────────────┬────────────────────────────────────────┘
                                  │ 调用
                                  ▼
scripts/sync-tenders.mjs  ──扩展──►  步骤 4：事件留痕（append-only）
        │                            步骤 5：agent-activity 记一行
        │                                    │
        │ 写（现状）                           │ 写（新增）
        ▼                                    ▼
src/data/tenders.generated.json      data/tenders-history/YYYY-MM.jsonl
public/data/tenders.json             data/agent-activity.jsonl
                                     （均 git 追踪，纯追加，每日 diff 只显新行）
                                               │
                                               ▼
                              scripts/aggregate-tenders.mjs（新增）
                                               │ 双写 ×2
              ┌────────────────────────────────┼────────────────────────────────┐
              ▼                                ▼                                ▼
 src/data/tender-trends.        public/data/tender-trends.json      public/data/agent-activity.json
 generated.json（首屏）          （趋势热刷，随每日同步更新）          （日报卡片热刷，最近 N 条）
              └────────────────────────────────┬────────────────────────────────┘
                                               ▼
                        /tenders 页 <TenderTrends> + <AgentPulse>
                        （首屏 + 挂载后热刷，复刻 TenderBoard 模式，零新依赖）
```

## 3. 数据层设计

### 3.1 历史库：纯事件溯源

- 路径：`data/tenders-history/YYYY-MM.jsonl`（按月分片，只追加，**永不重写**）。
- 两类行：

**明细行**（精匹配，即进入现有快照 `items[]` 的条目；在 14 天快照窗口内每天出现一次写一行）：

```json
{ "kind": "item", "id": "70232485553220", "syncDate": "2026-08-01", "title": "……", "tenderType": "招采", "date": "2026-07-29", "province": "贵州省", "city": "贵阳市", "buyer": "……", "moneyWan": 0, "professions": ["系统集成"], "stars": 4, "score": 12, "stageName": "……", "bidDeadline": "……", "sourceUrl": "……" }
```

**meta 行**（每天一行，保留宽口径分母，噪音明细不进公开仓库）：

```json
{ "kind": "meta", "syncDate": "2026-08-01", "rawCount": 174, "softwareCount": 153, "matchedCount": 80, "fiveStarCount": 3, "syncOk": true }
```

- **不存派生字段**：`firstSeenAt / lastSeenAt / seenCount` 一律聚合期计算（首行日期 / 末行日期 / 行数）。
- 明细行只保留聚合与展示需要的字段，`deepAnalysis` 全文、附件清单不进历史库（体积/合规边界，附件本体也不入库）。
- API 故障日：只写 `syncOk: false` 的 meta 行，趋势图据此显示断点而非造假数据。
- 敏感纪律：沿用现有约定——凭证只在 `.env.local`；历史库进公开 git，字段均为公开平台可见信息。

### 3.2 聚合产物（双写，同方案 C 模式）

`src/data/tender-trends.generated.json`（首屏）与 `public/data/tender-trends.json`（热刷），内容一致：

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-08-01T02:00:00.000Z",
  "historyFrom": "2026-08-01",
  "dataAsOf": "2026-08-01",
  "syncHealth": [{ "date": "2026-08-01", "ok": true }],
  "weekly": [
    { "week": "2026-W31", "newCount": 12, "activeCount": 46, "expiredCount": 8, "fiveStarCount": 2, "totalMoneyWan": 8300 }
  ],
  "byCity": [{ "city": "贵阳市", "count": 61, "moneyWan": 12000 }],
  "byProfession": [{ "name": "系统集成", "count": 88 }],
  "moneyBuckets": [{ "bucket": "100-500万", "count": 17 }],
  "topBuyers": [{ "buyer": "……", "count": 6 }],
  "highlights": [{ "id": "…", "title": "…", "stars": 5, "firstSeenAt": "…", "moneyWan": 0 }]
}
```

**三态口径（评审确认版）**：

- `new`：`firstSeenAt`（该 id 首行 syncDate）落在本周。
- `active`：出现在**最近一次成功快照**中（快照窗口 14 天，出现即在窗）。
- `expired`：最近一次成功快照中缺席（出窗即真出窗，非抓取抖动；`syncOk:false` 的日子不判定 expired，顺延到下一次成功快照）。

**计数口径细则（终审补充）**：

- `byCity / byProfession / moneyBuckets / topBuyers` 的统计对象为**去重后的条目**（按 id 取最新一行），不是快照行数。
- `byProfession` 按「条目×行业出现次数」计：一条标讯挂 3 个 professions 就在 3 个行业各计 1 次，**合计 ≠ 条目总数**，图表需注明「一条标讯可属多个行业」。
- 金额缺失（`moneyWan = 0`）单独成桶，不污染均值。
- `weekly` 保留近 12 周；数据不足时前端显示「积累中」而非空图。

### 3.3 agent-activity 数据

- 写入：sync 每次运行（无论成败）append 一行到 `data/agent-activity.jsonl`：

```json
{ "ts": "2026-08-01T01:05:33.000Z", "agent": "tenders-sync", "ok": true, "newCount": 4, "activeCount": 80, "artifacts": ["data/tenders-history/2026-08.jsonl", "public/data/tender-trends.json"], "note": "" }
```

- 展示链路（终审补充，同趋势产物模式）：aggregate 步骤顺带产出 `public/data/agent-activity.json`（最近 30 条，倒序），页面卡片挂载后热刷；构建期从 JSONL 末尾取最近一条 inline 进 HTML 作首屏。
- 后续其他 agent（电台、内容）接入同一 JSONL，卡片横向扩展，不另起架构。

## 4. 代码改动清单

| # | 文件 | 动作 | 说明 |
|---|------|------|------|
| 1 | `scripts/sync-tenders.mjs` | 扩展 | 末尾加「步骤 4：事件留痕」+「步骤 5：activity 记账」（含失败路径，try/catch 不阻断主流程） |
| 2 | `scripts/lib/tender-history.mjs` | 新增 | 纯追加写入：当月分片存在则 append，不存在则新建；写 item 行 + meta 行；Node 内置模块 |
| 3 | `scripts/aggregate-tenders.mjs` | 新增 | 扫 `data/tenders-history/*.jsonl` → 计算三态/分桶（按 §3.2 口径）→ 双写 src/data 与 public/data；顺带产出 `public/data/agent-activity.json` |
| 4 | `src/lib/tender-trends.ts` | 新增 | 聚合产物与 activity 的 TypeScript 类型（含 schemaVersion） |
| 5 | `src/components/TenderTrends.tsx` | 新增 | 趋势区块：首屏 + 热刷（复刻 TenderBoard）；手绘 SVG，响应式；行业图注明多行业口径 |
| 6 | `src/components/AgentPulse.tsx` | 新增 | 「工坊 AI 最近干了啥」卡片：首屏 inline 最近一条 + 挂载后 fetch `/data/agent-activity.json` 热刷 |
| 7 | `src/app/tenders/page.tsx` | 修改 | 引入聚合产物，`<AgentPulse>` 顶部、`<TenderTrends>` 置于 `TenderBoard` 上方 |
| 8 | `package.json` | 修改 | 新增 `"tenders:aggregate": "node scripts/aggregate-tenders.mjs"`；sync 后链路挂上聚合 |
| 9 | `scripts/predeploy-check.mjs` | 修改 | 校验：`public/data/tender-trends.json` 与 `agent-activity.json` 存在且 `dataAsOf` 不晚于 `tenders.json` 快照日期 |
| 10 | `scripts/tenders-daily.sh` | 修改 | sync 后追加 `npm run tenders:aggregate` |
| 11 | `.github/workflows/tenders-sync.yml` | 修改（M3 时） | 删除 `schedule:` 触发，保留 `workflow_dispatch` 作手动备用按钮；与 Hermes cron 切换同 PR 完成 |
| 12 | 测试 | 新增 | 历史库与聚合单测：跨月分片、坏行容错、三态边界（出窗判定、syncOk:false 顺延）、多 profession 计数口径、双写一致性；沿用 `node --test` |

**依赖新增：0。** 这是本方案的硬约束。

## 5. 周报与「AI 工作日报」

### 5.1 周报生成（模型任务）

- 每周一早上触发（避开整点/半点）。
- 输入：本周 + 上周聚合 JSON；**数据积累不足 5 天时不算环比**，报告中注明「无环比，数据积累中」。
- 产出：`docs/weekly-bid-reports/2026-W32.md`，结构：
  1. 本周概览（new / active / expired / 5 星数、总金额、环比——若有）
  2. 值得盯的 3-5 条（5 星 + 临近截止 + 大额）
  3. 地域/行业异动（某市州突增、某行业词频抬头）
  4. 数据健康（syncOk 记录、断点说明）
- **口径纪律（终审补充）**：第 3 点的行业洞察只能由精匹配明细计算（meta 行无 professions 分布），周报中必须标注「行业分布基于精匹配条目」，不得与 rawCount/softwareCount 宽口径数字混用或并列对比。
- 推送：第一版只落文件 + 会话内交付；飞书 webhook 推送列为可选项（见 §7 决策点 2）。

### 5.2 AI 工作日报卡片

见 §3.3。数据源 JSONL + 热刷 JSON 双轨，与趋势产物同生命周期。

## 6. 执行编排（评审后修订：可插拔契约）

方案只规定脚本顺序与产物位置，不绑定运行时。当前建议分工：

| 任务 | 调度归属 | 理由 |
|------|----------|------|
| 每日 sync + aggregate + commit/push | **Hermes cron** | 确定性脚本活，复用早报/正高监控的成熟链路与失败告警；凭证留本机 `.env.local`，不出机 |
| 每周周报生成 | 模型任务（Hermes cron 挂 agent / Kimi Work 定时任务，飞雪择一） | 需要模型判断；产物落 `docs/weekly-bid-reports/` |
| 本机 launchd | 观察两周后卸载 | 并行期改为只 sync 不 commit，避免与 Hermes 双 commit 撞车 |
| GHA `tenders-sync.yml` | **M3 时删除 schedule，保留 workflow_dispatch** | 境外 runner 每日 09:00 commit/push 与 Hermes 必撞车（已核实：该 workflow 每日运行并推送两个 JSON）；降级为手动备用按钮 |
| GHA `ci.yml` | 不动 | 纯 CI 职责不变 |

> 说明：Kimi Work 定时任务同样是本机执行（非云端），凭证信任边界与 cron 一致；上表归属是「成熟度优先」的工程判断，不绑定任何一方。

## 7. 遗留决策点（需飞雪拍板）

1. ~~回填 90 天~~ → 降级：不回填，趋势从 2-3 周自然积累起步；若有人顺手验证 API 窗口上限 > 14 天，再单独立项。
2. **飞书推送**：webhook URL 属密钥，存 `.env.local`，不进 git。本期先只看 Markdown 质量，两期后再定是否接推送。
3. **周报运行的 runtime**：Hermes cron 挂 agent 还是 Kimi Work 定时任务，飞雪按使用习惯选（产物与脚本不变）。
4. 趋势区块先页内；**拆分触发条件**：趋势区块超过 ~3 屏高或历史数据满 6 个月，即拆 `/tenders/trends` 独立页，不等它自己长。

## 8. 里程碑与验收

| 里程碑 | 内容 | 验收标准 | 预估（含缓冲） |
|--------|------|----------|------|
| M1 | 事件留痕 + activity 记账（#1 #2 #12 部分） | 连续 3 天同步后 JSONL 纯追加、无重写；失败路径也记账；单测过；`test:predeploy` 绿 | 1 天 |
| M2 | 聚合 + 趋势区块 + 日报卡片 + 热刷（#3–#10） | 本地预览见趋势图与卡片；改 `public/data` 后热刷生效；多行业计数口径抽查一致；predeploy 校验生效 | 2 天 |
| M3 | Hermes cron 接管 + **禁用 tenders-sync.yml schedule**（#11） | 每日任务连续 3 次成功；GHA 仅手动触发；launchd 进入只 sync 不 commit 并行观察 | 1 天 |
| M4 | 周报第一期 | 周一产出首份周报，人工评审质量（首期无环比注明、行业口径标注） | 1 天 |

每个里程碑独立可发版（AGENTS.md 流程：changelog → predeploy → push → deploy），M1 上线即开始沉淀，不等全链。**总估 5 天**（原始估算 2.5 天，按评审意见加一倍缓冲）。

## 9. 风险与对策

| 风险 | 等级 | 对策 |
|------|------|------|
| bxnd API 单一依赖 / 账号失效 | 高 | 历史库即降级资产；页面标注「数据截至」；`syncOk:false` 入 meta 行，cron 告警当日可见 |
| 编排迁移期双 commit 撞车（GHA / launchd / Hermes 三方） | 中 | M3 同 PR 禁用 GHA schedule；launchd 并行期只 sync 不 commit；已核实 GHA 现状（每日 09:00 push 两个 JSON） |
| 聚合口径日后变更导致历史不可比 | 中 | 聚合产物带 `schemaVersion`，口径变更时 changelog 注明；历史 JSONL 为原始事件，可随时重算 |
| 周报口径混淆（宽/窄混用误导读者） | 中 | §5.1 口径纪律写入验收；行业洞察仅精匹配口径并标注 |
| 公开仓库数据合规 | 低 | 明细只存精匹配公开字段；宽匹配只有计数；无附件本体、无深挖全文 |
| 趋势页没人看（自嗨风险） | 低 | 周报才是真实消费场景；页面趋势是「数据智能活广告」，服务对外叙事 |
