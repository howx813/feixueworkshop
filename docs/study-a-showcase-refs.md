# 展厅气质研究清单（A 线）

**目标**：只学「信息架构 + 首屏叙事 + 内容怎么进仓库」，**不大重构、不整仓替换**。  
**本地仓库**（已克隆）：

- `/Users/xuhao/Projects/_refs/magic-portfolio` ← [magicuidesign/portfolio](https://github.com/magicuidesign/portfolio)
- `/Users/xuhao/Projects/_refs/tailwind-blog` ← [timlrx/tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog)
- 对照：`/Users/xuhao/Projects/feixue-workshop`

---

## 0. 本周只回答 3 个问题

1. 访客 5 秒内能否说出「这人是谁、能看什么」？  
2. 导航是否一眼分清：**看人 / 看作品 / 看工具 / 看思考**？  
3. 内容更新是「改组件」还是「改数据/MDX」？（后者才可长期养）

---

## 1. Magic Portfolio —— 学展厅气质

### 1.1 启动

```bash
cd /Users/xuhao/Projects/_refs/magic-portfolio
npm i
npm run dev
```

浏览器打开本地地址，先**当访客**点一遍，再看代码。

### 1.2 必看文件（按顺序）

| 顺序 | 路径 | 看什么 |
|------|------|--------|
| 1 | `src/data/resume.tsx`（或同目录数据文件） | 人设、经历、项目是否**数据集中** |
| 2 | `src/app/page.tsx` | 首屏如何拼 Hero → 经历 → 项目 |
| 3 | `src/app/layout.tsx` | 字体、主题、全局壳 |
| 4 | `src/components/section/*` | 每一「区块」怎么拆，边界是否清晰 |
| 5 | `src/components/magicui/*` | 动效用在哪、哪些可以不加 |
| 6 | `src/app/blog/*` + `src/components/mdx/*` | 博客是否与首页解耦 |

### 1.3 对照飞雪工坊 · 可借鉴

| Magic 做法 | 工坊现状 | 可落地的小改（建议） |
|------------|----------|----------------------|
| 单文件/数据集中描述「我是谁」 | `src/data/content.ts` 已有雏形 | 把首页首屏文案收成「一屏人设 + 三入口」，少堆说明 |
| Section 组件化 | 页面较长、模块多 | 首页只保留 3–4 个锚点区块，其余进子页 |
| 动效克制、服务层级 | Lab 很强但首页叙事易被工具淹没 | **工具入口降一级**，展厅/Lab 升一级视觉权重 |
| 博客独立路由 | 已有 `insights` / `changelog` / `weekly` | 明确三者差异，避免三个「都像文章」 |

### 1.4 明确不抄

- 不做成纯简历站（丢掉标讯/Lab）  
- 不上全套 Magic UI 动画（静态导出 + 克制品牌更适合你）  
- 不改技术栈去追 shadcn（除非有明确收益）

---

## 2. Tailwind Blog Starter —— 学内容资产化

### 2.1 启动

```bash
cd /Users/xuhao/Projects/_refs/tailwind-blog
npm i   # 或 yarn，按仓库 README
npm run dev
```

### 2.2 必看文件（按顺序）

| 顺序 | 路径 | 看什么 |
|------|------|--------|
| 1 | `data/siteMetadata.js`（或 `.ts`） | 站点级元信息如何集中 |
| 2 | `data/blog/*` | 文章是否「丢进文件夹即发布」 |
| 3 | `app/blog/**` | 列表页 / 详情页路由 |
| 4 | `layouts/*` | 文章版式与站点壳分离 |
| 5 | `components/*` 里与 Tag、Search、Pagination 相关 | 内容多了怎么检索 |
| 6 | SEO/RSS 相关配置（`next-sitemap` / `rss` 等，以仓库为准） | 长期写作是否可被订阅/收录 |

### 2.3 对照飞雪工坊 · 可借鉴

| Blog Starter 做法 | 工坊现状 | 可落地的小改 |
|-------------------|----------|--------------|
| MDX/Markdown 进 `data/blog` | 周报在 `docs/weekly-hub`，changelog 在 ts | 选一条线（建议 **weekly 或 insights**）试点「Markdown 投放 → 构建进站」 |
| 标签与列表 | 文章型页面偏散 | 给观点/周报加简单分类：工作 / 思考 / 家庭事业（内部可隐藏） |
| About 独立 | 人设散落在首页 | 强化「关于飞雪」一页，首页只摘要 |

### 2.4 明确不抄

- 不把工坊改成纯博客  
- 不上 newsletter 全家桶（除非真要做邮件）  
- 不引入沉重 CMS

---

## 3. 对照实验（90 分钟作业）

打开三个站点（Magic 本地 / Blog 本地 / 飞雪工坊线上或本地），填表：

| 维度 | Magic | Blog Starter | 飞雪工坊 | 我准备怎么改 |
|------|-------|--------------|----------|--------------|
| 5 秒人设是否清楚 | | | | |
| 导航项数量（越少越好） | | | | |
| 首屏是否有「下一步点哪里」 | | | | |
| 更新一篇内容要改几个文件 | | | | |
| 工具页是否抢走展厅焦点 | | | | |

---

## 4. 研究结束后的唯一产出（半页纸）

写清三句即可：

1. **保留**：工坊里什么绝对不能丢（例：Lab、标讯、雪花品牌）  
2. **收敛**：首页准备删/挪哪些入口  
3. **一条管道**：下周只打通一种内容更新方式（例：周报 MD → `/weekly`）

### 已落地（2026-08-19）

1. **保留**：Lab、标讯/周报、雪花品牌与侧栏信息架构不动  
2. **收敛**：首页增加人设首屏 + 三入口（展厅 / 宝匣 / 工作台）；热点下移；作品只露 3 个切片；观点缩到 2 条  
3. **下一条管道（未做）**：周报 MD → `/weekly` 仍按原链路，本周不扩 CMS

---

## 5. 建议时间盒

| 日 | 任务 | 时长 |
|----|------|------|
| D1 | 跑通 Magic，只当访客体验 + 读 `resume`/`page` | 1.5h |
| D2 | 跑通 Blog Starter，读 `data/blog` + `layouts` | 1.5h |
| D3 | 填对照表，写出「半页纸」产出 | 1h |
| D4 | （可选）在工坊只做 **一个** 小改：首页三入口或人设摘要 | ≤2h |

---

*A 线完成后再开 B 线（AI Chatbot / Fragments）。*
