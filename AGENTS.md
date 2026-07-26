# 飞雪工坊 · 协作约定

## 标准开发流程（固定顺序）

```
改代码 → 本地 dev 看效果 → 预检测试 → 通过后推 GitHub → 再部署腾讯云
```

**禁止跳步：**

- 预检没过，不 push（除非用户明确只要备份草稿）
- 预检没过，**绝不**部署腾讯云
- 未 push 也可以部署，但不推荐；默认「先 GitHub 再上云」，保证线上与仓库一致

### 每一步做什么

| 步骤 | 命令 / 动作 | 通过标准 |
|------|-------------|----------|
| 1. 改代码 | 按需求改 `src/` 等 | 逻辑正确、不引入密钥 |
| 2. 本地看 | `npm run dev` → http://localhost:3456 | 页面/交互手测 OK |
| 3. 预检 | `npm run test:predeploy` | lint + build + 页面 + 电台音源 + 密钥扫描全 ✔ |
| 4. GitHub | `git add` → `commit` → `git push` | 远端 `main` 更新；**不含** `.env.local` |
| 5. 腾讯云 | `npm run deploy` | 内部再跑预检，通过才上传 `out/` |

### 一键命令备忘

```bash
cd /Users/xuhao/Projects/feixue-workshop

# 开发（写代码时）
npm run dev

# 测试（部署前必跑，会跑 next build）
npm run test:predeploy

# 预检后的可靠预览（静态 out，不跑 next dev，无 948.js 问题）
npm run preview:out
# → http://localhost:3457

# 若必须继续 next dev 且已损坏
npm run dev:clean

# 提交并推送（预检通过后）
git add .
git status   # 确认没有 .env.local
git commit -m "说明改了什么"
git push

# 上线（内部会再预检）
npm run deploy
```

### 本地缓存故障（必须正视）

症状：`Cannot find module './948.js'`、`__webpack_modules__ is not a function`、CSS 500、Server Error。  

**根因（已实测）：**  
`next build`（即使 distDir=.next-export）与正在跑的 `next dev` **并发时仍会弄坏** dev 的 `.next`。  

**正确用法：**  
1. 写代码 → `npm run dev`  
2. 要测上线质量 → `npm run test:predeploy`（**可先停掉 dev**，更稳）  
3. 看构建结果 → `npm run preview:out`（**不要**指望旧 dev 进程还健康）  
4. 再开发 → `npm run dev:clean`  

助手侧（强制）：
1. 改完必须 `npm run test:predeploy`，输出通过证据  
2. 预检后验证用 **preview:out 或 curl out/**，不要只信「dev 还开着」  
3. 用户报 948 / webpack / Server Error：立刻 `dev:clean` 或改用 preview:out  
4. **禁止**未测或预检失败就部署  
5. **禁止**在已知 dev 已损坏时让用户「刷新一下试试」

### 预检内容（test:predeploy）

1. eslint  
2. 生产构建 `EXPORT=1 next build` → `out/`  
3. 关键静态页存在且含关键文案  
4. 电台 free 曲目音源抽样可达  
5. 构建产物无密钥片段  

预检失败 → 只修问题 → 重跑预检 → 全过再 push / deploy。

### 助手行为要求

1. 改完功能：默认先本地验证思路，并跑 `npm run test:predeploy`  
2. 用户说「推 GitHub / 提交」：预检通过后再 commit + push  
3. 用户说「部署 / 上线」：预检通过后再 `npm run deploy`（建议确认 GitHub 已同步）  
4. 预检失败：报告失败项，**不** push、**不**部署  
5. 密钥永远只在 `.env.local`，不进仓库、不进 `out/`  

## 环境与地址

| 项 | 值 |
|----|-----|
| 本地 | http://localhost:3456 |
| GitHub | https://github.com/howx813/feixueworkshop |
| CloudBase 环境 | `howx813-d7gx02spb2681185c` |
| 线上 | https://howx813-d7gx02spb2681185c-1456523152.tcloudbaseapp.com |

## 可选：一条龙（仅用户明确要求时）

```bash
npm run test:predeploy && git add . && git commit -m "..." && git push && npm run deploy
```

任一步失败即停止。
