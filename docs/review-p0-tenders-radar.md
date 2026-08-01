# P0 商机雷达设计评审（2026-08-01）

> 评审对象：`docs/p0-tenders-radar-design.md`（K3 执笔）
> 评审人：DeepSeek v4（Hermes）
> 供飞雪转发 K3 讨论

## 总体评价

设计整体成立：JSONL + git 存储、零后端、构建期预聚合、里程碑独立发版、schemaVersion、明确非目标——这些决策都合理，可以在此基础上迭代。

但有 4 个问题需要先讨论，其中 2 个是架构级（问题 1、2），不解决会埋雷。

## 问题 1（架构级）：编排层押注 Kimi Work 的风险

设计 §6 写"Kimi Work 定时任务成为主力，接管 launchd"，但未说明"Kimi Work 定时任务"的确切形态：

- 若是月之暗面云端平台：sync 脚本需要 BXND_USERNAME/PASSWORD，凭证必须交给第三方平台（设计未提凭证方案）；每日抓取是确定性脚本活，押在第三方云上可用性反而不如本机（网络/平台/token 任一断环即静默失败）。
- 若是本机 Kimi Code CLI + cron：与 launchd 无本质区别，换汤不换药。

**建议**：编排层用本机 Hermes cron（飞雪已有早报、正高监控 cron 在跑，链路成熟）：
- 每日 sync + aggregate + commit/push：确定性脚本，cron 直接调
- 每周周报：cron 挂 agent 能力，读聚合 JSON 生成 Markdown
- 失败告警：cron 失败自动通知
- 凭证留在 .env.local，不碰第三方

请 K3 澄清"Kimi Work 定时任务"的确切形态 + 凭证方案，再定编排层。

## 问题 2（数据模型）：append-only 与"就地更新"矛盾

§3.1 先写"append-only，按 id 去重更新"，随即写"已有 id → 就地更新 lastSeenAt、seenCount+1，并刷新可变字段（实现上按月分片重写该月文件）"。

重写整月文件 = JSON 换 .jsonl 扩展名，append-only 的 O(1) 追加、git diff 只显新增行的优势全丢；每天整月文件变一遍，git diff 难看。

**建议**：事件溯源式快照行：
- 每天同步，每条标讯写一行 { id, date, ...字段 }，只追加、不重写
- firstSeenAt = 该 id 首行 date，lastSeenAt = 末行，seenCount = 行数，聚合时计算，无需显式字段
- git 历史 = 每日快照完整回溯

## 问题 3（更新链路漏洞）：趋势聚合产物是构建期生成，不 deploy 不更新

现有标讯列表能"活"靠运行时热刷 public/data/tenders.json。但 tender-trends.generated.json 按设计只进构建产物 → 趋势图只在 deploy 时更新。一周一版 + GHA 每天只 commit 不 deploy → 线上趋势图 stale 最多 6 天，与"商机雷达"定位矛盾。

**建议**：聚合产物同步输出 public/data/tender-trends.json，页面运行时热刷；构建期 JSON 只做首屏（同方案 C 模式）。

## 问题 4（口径）：activeCount 的"窗口"定义失真

设计写"activeCount 按 lastSeenAt 仍在窗口内计"，但抓取窗口是 14 天：一条 13 天前抓到的标讯只要今天还在快照里，就一直算 active 到 14 天——这是"刚见过"，不是"在途"。

**建议**三态口径：
- new = firstSeenAt 在本周
- active = 今天快照里还出现
- expired = 今天快照里没有，且 lastSeenAt 已过 N 天

## 细节建议（可拍板）

5. 宽匹配全量留痕建议折中：明细只存精匹配，宽匹配只存每天计数（分母靠计数足够，4.7 万条/年噪音明细进公开 git 仓库没必要）；若全存至少打 matchScore 标记，聚合按口径过滤。
6. 周报"环比"在数据不足 3-5 天时无意义，第一期注明"无环比、数据积累中"。
7. 回填 90 天大概率不可行（API 窗口 14 天），趋势图从 2-3 周起步即可，别耗时间。
8. 里程碑总估 2.5 天偏乐观，排期留一倍缓冲。
9. 趋势区块先页内（同意），但预告独立页节奏，别等它自己长。
