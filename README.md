# 飞雪工坊 · Feixue Workshop

用 AI 重做工作流。个人 AI 能力展厅网站。

## 本地开发

```bash
npm install
npm run dev
```

默认端口：[http://localhost:3456](http://localhost:3456)

### CSS 没了 / `948.js` / Server Error？

**原因：** `next build`（预检会跑）和 `next dev` 不要长期并行，会弄坏 `.next`。

| 场景 | 命令 |
|------|------|
| 写代码 | `npm run dev` → :3456 |
| 预检 | `npm run test:predeploy` |
| 看构建结果（推荐） | `npm run preview:out` → :3457 |
| dev 已坏 | `npm run dev:clean` |

预检后优先用 **3457 静态预览**，不要死磕旧的 3456 dev 进程。

## 环境变量（可选）

复制示例文件后填写本地密钥（**不要提交真实密钥**）：

```bash
cp .env.example .env.local
```

| 变量 | 说明 |
|------|------|
| `NETEASE_*` | 网易云开放平台凭证（仅本机/服务端） |
| `NETEASE_PLAYLIST_ID` | 可选，同步歌单用 |

同步歌单曲库：

```bash
npm run music:sync
```

## 构建（静态导出）

```bash
npm run build
```

产物在 `out/`（已在 `.gitignore` 中，不必提交）。

## 标准开发流程

```
改代码 → npm run dev 手测 → npm run test:predeploy → git push → npm run deploy
```

| 顺序 | 动作 | 命令 |
|------|------|------|
| 1 | 改代码 | — |
| 2 | 本地预览 | `npm run dev`（http://localhost:3456） |
| 3 | 预检测试 | `npm run test:predeploy` |
| 4 | 上传 GitHub | `git commit` + `git push` |
| 5 | 部署腾讯云 | `npm run deploy` |

**铁律：预检不过，不 push 上线、不部署腾讯云。**

### 部署到腾讯云 CloudBase

环境 ID：`howx813-d7gx02spb2681185c`

```bash
# 一次性：安装并登录 CLI
npm i -g @cloudbase/cli
tcb login

# 每次上线（deploy 内部会再跑预检 + 备份线上以便回退）
npm run test:predeploy
git push
npm run deploy

# 不满意 → 回退到部署前的线上版本
npm run rollback
npm run rollback -- --list
```

线上：https://howx813-d7gx02spb2681185c-1456523152.tcloudbaseapp.com  

控制台：https://tcb.cloud.tencent.com/dev?envId=howx813-d7gx02spb2681185c#/static-hosting

### 回退说明

`npm run deploy` 每次会：

1. 预检  
2. **下载当前线上** → `.deploy-history/<时间>-live`  
3. 备份本次 `out/` → `.deploy-history/<时间>-out`  
4. 再上传新版本  

不满意时：

```bash
npm run rollback                 # 默认恢复「部署前的线上」
npm run rollback -- --list       # 看历史
npm run rollback -- --id 时间戳  # 指定某次
```

## 页面结构

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/showcase/` | 能力展厅 |
| `/insights/` | 观点精选 |
| `/music/` | 工坊电台（网易云随机播放） |
| `/lab/` | 手搓匣（灵机一动的小玩意） |
| `/lab/marble/` | 碎砖弹珠 |
| `/lab/snowflake/` | 雪花函数（科赫） |
| `/changelog/` | 更新日志 |

## 技术栈

- Next.js 14 (App Router, SSG export)
- TypeScript
- Tailwind CSS
