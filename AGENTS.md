# 飞雪工坊 · 协作约定

## 标准开发 / 发版流程（固定顺序）

```
改代码 → 本地手测 → 预检 → 推 GitHub → 部署腾讯云（自动打 tag）
```

### 步骤表

| 步骤 | 动作 | 命令 |
|------|------|------|
| 1 | 改代码 | 含在 `src/data/changelog.ts` **顶部**追加新版本 |
| 2 | 本地手测 | `npm run dev`（:3456） |
| 3 | 预检 | `npm run test:predeploy` |
| 4 | 提交并推 GitHub | `git commit` + `git push` |
| 5 | 部署腾讯云 | `npm run deploy`（预检 + 备份线上 + 上传 + **打 `vX.Y.Z` tag 并 push**） |

**禁止：** 预检不过就 push 上线 / 部署。

### 版本号从哪来？

- **唯一权威：** `src/data/changelog.ts` 第一条 `version: "x.y.z"`
- 发版前先写 changelog，再 deploy
- `npm run version:print` 查看当前版本
- deploy 会同步 `package.json` 的 version，并创建 git tag **`v` + 版本号**（如 `v0.2.5`）

### GitHub 的作用

| 能力 | 说明 |
|------|------|
| 代码备份 | 源码与历史 |
| **发版 tag** | `v0.2.5` = 可复现的一版代码 |
| 协作 | 换机器 / 找人改 |

腾讯云只存**构建产物**；GitHub 存**代码 + tag**。

### 回退（两条线）

**A. 快速回退线上（本地快照，不改代码）**

```bash
npm run rollback -- --list
npm run rollback                 # 回到「上次部署前」的线上包
```

依赖本机 `.deploy-history/`（不进 git）。

**B. 从 Git tag 重新上线（可换机器，推荐中长期）**

```bash
git tag -l 'v*'
npm run release:from -- v0.2.5   # worktree 检出 → 预检 → 部署
```

对应关系：

```text
changelog 0.2.5  ≈  git tag v0.2.5  ≈  某次成功 deploy 的代码状态
```

### 命令备忘

```bash
# 开发
npm run dev
npm run dev:clean          # 948.js / CSS 坏了

# 测试
npm run test:predeploy
npm run preview:out        # :3457 看 out/，预检后推荐

# 发版
# 1) 改 changelog 顶部 version
# 2) commit + push
# 3)
npm run deploy             # 上云 + 打 tag
# 或只打 tag：
npm run release:tag

# 回退
npm run rollback
npm run release:from -- v0.1.3   # 若历史上有该 tag
```

### 本地缓存故障（构建隔离，务必）

**历史：** 同目录 `next build` + `next dev` → `948.js` / `__webpack_modules__`。

**现方案：** `npm run build` = `scripts/build-export.mjs`  
在系统临时目录构建，只回写 `out/`，**不碰项目 `.next`**。

若仍异常（旧进程）：`npm run dev:clean`

- 预检后看站：用 **`npm run preview:out`**
- dev 坏了：`npm run dev:clean`

### 部署依赖：tcb CLI（故障排查）

**依赖：** `npm run deploy` 底层调 `tcb hosting deploy`（`@cloudbase/cli`）。

**案例（2026-07-27）：** 环境里 `tcb` 不存在 → 上传步骤静默失败，只报「部署失败」，
线上可能只传了部分文件（如只有 `404.html`）。

排查顺序：

```bash
tcb --version                                  # 不存在则：
npm i -g @cloudbase/cli                        # 登录态共享，重装无需再 login
tcb hosting list -e howx813-d7gx02spb2681185c  # 验证登录态 + 看线上文件时间戳
npm run deploy                                 # 重跑，会完整覆盖上传
```

**注意：** 部分上传后无需手工清理，重跑 deploy 会全量覆盖。

### 助手强制行为

1. 改完跑 `test:predeploy`，通过再言完成  
2. 发版提醒先写 changelog 版本号  
3. deploy 后确认 tag 已推送（或说明失败）  
4. 密钥不进仓库  

## 环境

| 项 | 值 |
|----|-----|
| 本地 dev | http://localhost:3456 |
| 本地 preview | http://localhost:3457 |
| GitHub | https://github.com/howx813/feixueworkshop |
| 线上 | https://howx813-d7gx02spb2681185c-1456523152.tcloudbaseapp.com |
| envId | `howx813-d7gx02spb2681185c` |
