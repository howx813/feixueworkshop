# 飞雪工坊 · Feixue Workshop

用 AI 重做工作流。个人 AI 能力展厅网站。

## 本地开发

```bash
npm install
npm run dev
```

默认端口：[http://localhost:3456](http://localhost:3456)

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

## 部署到腾讯云开发 CloudBase

环境 ID：`howx813-d7gx02spb2681185c`

```bash
npm i -g @cloudbase/cli
tcb login
npm run build
tcb hosting deploy out -e howx813-d7gx02spb2681185c
```

控制台：  
https://tcb.cloud.tencent.com/dev?envId=howx813-d7gx02spb2681185c#/static-hosting

## 页面结构

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/showcase/` | 能力展厅 |
| `/insights/` | 观点精选 |
| `/music/` | 工坊电台（网易云随机播放） |

## 技术栈

- Next.js 14 (App Router, SSG export)
- TypeScript
- Tailwind CSS
