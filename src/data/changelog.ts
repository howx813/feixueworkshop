export type ChangelogItem = {
  text: string;
  tag?: "新增" | "优化" | "修复" | "文档";
};

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  summary: string;
  items: ChangelogItem[];
};

/**
 * 站点更新日志（新在前）。
 * 发版时在本文件顶部追加一条即可。
 */
export const changelog: ChangelogEntry[] = [
  {
    version: "0.2.21",
    date: "2026-07-27",
    title: "碎砖弹珠：换上真签名墙",
    summary:
      "砖块从文字标签换成真 logo：抓下 Ben Burtenshaw 可玩版梗图视频（1080p），逐帧裁出全部 50 个签名方 logo 和 ANTHROPIC 字标挡板；补齐小图里被挡住的 Ollama、Prime Intellect、Reflection，砖阵改为与梗图一致的 6×8+2=50，白底签名墙风格。",
    items: [
      { tag: "新增", text: "50 个签名方 logo 图片砖块 + ANTHROPIC 字标挡板（裁自原视频）" },
      { tag: "新增", text: "补录 Ollama / Prime Intellect / Reflection，凑齐完整 50 签名方" },
      { tag: "优化", text: "白底签名墙视觉，掉血 = logo 变淡，青色弹珠对齐原梗" },
    ],
  },
  {
    version: "0.2.20",
    date: "2026-07-27",
    title: "碎砖弹珠：Anthropic 打签名墙",
    summary:
      "碎砖弹珠换皮成黄仁勋 AI 开源签名梗图：挡板是唯一没签名的 Anthropic，48 块砖全是签了名的公司（按梗图逐格辨认录入），HUD 新增已清除计数。",
    items: [
      { tag: "新增", text: "48 块签名公司砖块（名字逐格辨认自梗图，含彩蛋砖 You?）" },
      { tag: "新增", text: "挡板标注 ANTHROPIC，HUD 显示已清除 n/48" },
      { tag: "优化", text: "砖阵由 6×10 调整为 6×8，砖面自适应字号" },
    ],
  },
  {
    version: "0.2.19",
    date: "2026-07-27",
    title: "51.la 统计生效",
    summary:
      "填入 51.la 应用 id/ck，全站统计正式上线；按官方文档改用 hashMode 支持 SPA 前端路由统计。",
    items: [
      { tag: "新增", text: "51.la 应用「飞雪工坊」创建并接线" },
      { tag: "修复", text: "SPA 支持参数由 autoTrack 更正为 hashMode" },
    ],
  },
  {
    version: "0.2.18",
    date: "2026-07-27",
    title: "网站统计接线（51.la）",
    summary:
      "全站接入 51.la 统计（V6 异步模式）：在 src/data/analytics.ts 配置 id/ck 后自动加载 SDK 并统计前端路由切换；未配置时完全静默、零请求。",
    items: [
      { tag: "新增", text: "LaAnalytics 组件挂入根布局" },
      { tag: "新增", text: "analytics.ts 配置位：留空即关闭统计" },
    ],
  },
  {
    version: "0.2.17",
    date: "2026-07-27",
    title: "引力沙盘",
    summary:
      "手搓宝匣新增引力沙盘：粒子风横穿屏幕，质量点如引力透镜掰弯流线，支持吸引/排斥双模式与参数滑杆。",
    items: [
      { tag: "新增", text: "/lab/gravity 引力沙盘：放质点弯曲粒子流" },
      { tag: "新增", text: "吸引/排斥双模式、引力/风速/粒子数滑杆" },
      { tag: "新增", text: "gravity-core 纯物理核心与单测" },
    ],
  },
  {
    version: "0.2.16",
    date: "2026-07-27",
    title: "流体实验室与字由粒子",
    summary:
      "手搓宝匣新增两个可玩实验：实时 Navier-Stokes 流体模拟、汉字粒子聚散交互；宝匣列表配上专属 SVG 图标；首页进一步极简化。",
    items: [
      { tag: "新增", text: "/lab/fluid 流体实验室：注入染料看扩散、涡旋与对流" },
      { tag: "新增", text: "/lab/particles 字由粒子：鼠标扫散、静止聚回成字" },
      { tag: "新增", text: "宝匣条目专属 SVG 图标（LabIcon）" },
      { tag: "优化", text: "首页去掉日期条与统计卡，更克制" },
      { tag: "优化", text: "站点图标改用 icon.tsx 动态生成" },
    ],
  },
  {
    version: "0.2.15",
    date: "2026-07-26",
    title: "图像小说搜索五页与支付模块",
    summary:
      "首页五人成片列表；下方搜索真实书名/人物，生成实体书封面 + 按原著开篇的五页图像小说；同时上线支付相关能力。",
    items: [
      { tag: "新增", text: "搜索书名/人物 → 真实书目五页" },
      { tag: "新增", text: "射雕/西游/松下等成片缓存" },
      { tag: "新增", text: "支付模块：服务端订单与确认脚本" },
      { tag: "优化", text: "极简首页：列表 + 搜索框" },
    ],
  },
  {
    version: "0.2.13",
    date: "2026-07-26",
    title: "图像小说五人五十页",
    summary:
      "极简入口；乔布斯、马斯克、杰克·韦尔奇、罗永浩、李开复各 50 页本地成片，全免费无付费墙。",
    items: [
      { tag: "新增", text: "五人各 50 页：乔布斯 / 马斯克 / 韦尔奇 / 罗永浩 / 李开复" },
      { tag: "优化", text: "页面极简：一个输入框打开阅读" },
      { tag: "优化", text: "取消付费解锁" },
    ],
  },
  {
    version: "0.2.12",
    date: "2026-07-26",
    title: "图像小说工坊",
    summary: "手搓匣图像小说实验初版。",
    items: [
      { tag: "新增", text: "/lab/graphic 图像小说" },
    ],
  },
  {
    version: "0.2.11",
    date: "2026-07-26",
    title: "标讯匹配星级 + 5★ 深挖",
    summary:
      "综合软件相关度与标准关键词等打 1–5 星；5 星尝试下载公开招标附件并摘录资格要求。",
    items: [
      { tag: "新增", text: "匹配星级与分级理由" },
      { tag: "新增", text: "5★ 附件下载与深挖摘要（本机 data/tender-docs）" },
    ],
  },
  {
    version: "0.2.10",
    date: "2026-07-26",
    title: "站点文案去敏",
    summary:
      "移除站点中机构称谓与内部资质表述；标讯匹配改为行业公开标准关键词提示。",
    items: [
      { tag: "修复", text: "页面/快照/changelog 去掉敏感机构字样" },
      { tag: "优化", text: "资质提示改为公开标准名称，不展示持证主体" },
    ],
  },
  {
    version: "0.2.9",
    date: "2026-07-26",
    title: "标讯关键四字段",
    summary:
      "每日标讯展示投标截止、文件资格摘录、项目规模、标书/文件费；从公告正文抽取并写入快照。",
    items: [
      { tag: "新增", text: "同步脚本抽取截止/资格/规模/文件费" },
      { tag: "优化", text: "列表关键信息四宫格 + 资格摘录" },
    ],
  },
  {
    version: "0.2.8",
    date: "2026-07-26",
    title: "标讯方案 C：定时快照",
    summary:
      "每日标讯走「静态站 + 定时同步」：双写 JSON、GitHub Actions / 本机 launchd，页面可热刷 /data/tenders.json。",
    items: [
      { tag: "新增", text: "public/data/tenders.json + 前端刷新快照" },
      { tag: "新增", text: "GitHub Actions tenders-sync 定时任务" },
      { tag: "新增", text: "本机 tenders-daily / install-tenders-launchd" },
    ],
  },
  {
    version: "0.2.7",
    date: "2026-07-26",
    title: "每日标讯",
    summary:
      "新增「每日标讯」栏目：汇总软件/信息化类招标线索并按公开标准关键词提示排序。",
    items: [
      { tag: "新增", text: "导航栏目 /tenders/ 每日标讯" },
      { tag: "新增", text: "npm run tenders:sync 同步标讯快照" },
      { tag: "新增", text: "公开标准关键词匹配口径" },
    ],
  },
  {
    version: "0.2.6",
    date: "2026-07-26",
    title: "隔离构建 + 弹珠去粘板",
    summary:
      "生产构建隔离到临时目录，修复 948.js；碎砖弹珠去掉粘板道具，挡板只反弹。",
    items: [
      { tag: "修复", text: "scripts/build-export.mjs 隔离构建，不碰项目 .next" },
      { tag: "优化", text: "预检/deploy 不再打挂 next dev" },
      { tag: "优化", text: "弹珠道具池移除粘板；接球一律弹开" },
    ],
  },
  {
    version: "0.2.5",
    date: "2026-07-26",
    title: "发版打 Git tag",
    summary:
      "发版流程：changelog 版本 → deploy 自动打 vX.Y.Z 并推 GitHub；可用 release:from 从 tag 重新上线。",
    items: [
      { tag: "新增", text: "npm run release:tag / release:from" },
      { tag: "新增", text: "deploy 成功后自动打 tag（可用 --no-tag 跳过）" },
      { tag: "文档", text: "AGENTS/README 写明 tag 与双轨回退（快照 + Git）" },
    ],
  },
  {
    version: "0.2.4",
    date: "2026-07-26",
    title: "修复 AI 精选一直加载",
    summary:
      "构建期预取精选写入 HTML；客户端带超时刷新。避免 JS/网络异常时卡在「正在拉取」。",
    items: [
      { tag: "修复", text: "Home 改为 async 服务端预取 initialItems" },
      { tag: "优化", text: "请求 10s 超时 + 重试按钮 + 有缓存时失败不白屏" },
    ],
  },
  {
    version: "0.2.3",
    date: "2026-07-26",
    title: "首页接入 AI HOT 精选",
    summary:
      "首页实时拉取 aihot.virxact.com 公开 API 的精选（mode=selected），展示标题、摘要与原文链接。",
    items: [
      { tag: "新增", text: "AihotSelected 组件 + /api/v1/items 客户端拉取" },
      { tag: "新增", text: "预检包含 AI HOT 接口连通性" },
      { tag: "文档", text: "注明数据来源与 attribution" },
    ],
  },
  {
    version: "0.2.2",
    date: "2026-07-26",
    title: "测试与缓存隔离",
    summary:
      "生产构建改用 .next-export，避免弄脏 dev；预检加入弹珠逻辑单测与 CSS 文件校验。",
    items: [
      { tag: "修复", text: "build/dev 分离 distDir，减少 948.js / CSS 失效" },
      { tag: "新增", text: "scripts/test-marble.mjs + npm run test:unit" },
      { tag: "优化", text: "预检 6 步：lint / 单测 / 构建 / 静态页+CSS / 音源 / 密钥" },
    ],
  },
  {
    version: "0.2.1",
    date: "2026-07-26",
    title: "碎砖弹珠",
    summary: "手搓匣新游戏：弹珠打砖，打碎砖块掉落道具。",
    items: [
      { tag: "新增", text: "/lab/marble/ 碎砖弹珠（Canvas）" },
      { tag: "新增", text: "道具：多球、加宽、粘板、慢速、火力、生命" },
      { tag: "新增", text: "键盘 / 鼠标 / 触摸均可操作" },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-07-26",
    title: "手搓匣栏目",
    summary:
      "新增「手搓匣」：收纳灵机一动的小软件；雪花函数迁入其中。",
    items: [
      { tag: "新增", text: "栏目名：手搓匣（Scratch Box）· /lab/" },
      { tag: "优化", text: "雪花函数路径改为 /lab/snowflake/，旧地址自动跳转" },
      { tag: "文档", text: "新玩具写入 src/data/lab.ts 即可挂上清单" },
    ],
  },
  {
    version: "0.1.9",
    date: "2026-07-26",
    title: "dev:clean 修复脏缓存",
    summary: "build/dev 交替导致 CSS 丢失时，一键清 .next 并重启开发服务。",
    items: [
      { tag: "新增", text: "npm run dev:clean（杀端口 + 删 .next + next dev）" },
      { tag: "文档", text: "README / AGENTS 写明无样式时的处理步骤" },
    ],
  },
  {
    version: "0.1.8",
    date: "2026-07-26",
    title: "固定研发上线流程",
    summary: "约定：改代码 → 预检 → GitHub → 腾讯云；预检不过不推送、不部署。",
    items: [
      { tag: "文档", text: "AGENTS.md / README 写明五步流程" },
      { tag: "文档", text: "npm run test:predeploy 与 npm run deploy 职责划分" },
    ],
  },
  {
    version: "0.1.7",
    date: "2026-07-26",
    title: "品牌标定为候选 C",
    summary: "导航雪花采用经典三角 Koch（candidates/C-tri-koch-classic.svg）。",
    items: [
      { tag: "优化", text: "SnowflakeMark 默认 sides=3、depth=3" },
      { tag: "文档", text: "选定方案写入 public/brand/logo.svg" },
    ],
  },
  {
    version: "0.1.6",
    date: "2026-07-26",
    title: "六角科赫雪花",
    summary: "Koch 基底改为正六边形（6 边 / 六重对称），更像真雪花；演示页可调边数。",
    items: [
      { tag: "优化", text: "默认 sides=6，正六边形上做 Koch 迭代" },
      { tag: "新增", text: "演示页可调基底边数 3–8（3=经典三角）" },
      { tag: "优化", text: "导航 logo 使用六角版" },
    ],
  },
  {
    version: "0.1.5",
    date: "2026-07-26",
    title: "科赫雪花品牌标",
    summary:
      "导航「雪」字改为数学生成的科赫雪花（Koch snowflake），并增加可调深度的演示页。",
    items: [
      { tag: "新增", text: "src/lib/koch-snowflake.ts：Koch 递归与六重晶体" },
      { tag: "新增", text: "导航 SnowflakeMark + /snowflake/ 演示页" },
      { tag: "优化", text: "品牌标由函数迭代生成，非贴图" },
    ],
  },
  {
    version: "0.1.4",
    date: "2026-07-26",
    title: "部署前强制预检",
    summary: "建立「先测后部署」流程：预检不通过禁止上云。",
    items: [
      { tag: "新增", text: "npm run test:predeploy（lint/构建/页面/音源/密钥扫描）" },
      { tag: "新增", text: "npm run deploy 仅在预检通过后上传 CloudBase" },
      { tag: "文档", text: "AGENTS.md 写明部署铁律，避免再跳过测试" },
    ],
  },
  {
    version: "0.1.3",
    date: "2026-07-26",
    title: "工坊电台可播修复",
    summary:
      "修复线上电台无声：版权曲无法在第三方站直连，改为可试听曲 HTML5 播放 + 版权曲跳转网易云。",
    items: [
      { tag: "修复", text: "多数热门曲 fee 版权限制导致外链/匿名拉流失败" },
      { tag: "优化", text: "可试听曲用 HTML5 播放器 + 用户点击后播放" },
      { tag: "优化", text: "版权曲明确标注，一键跳转网易云官方页" },
      { tag: "优化", text: "默认曲库改为可出声的试听曲为主" },
    ],
  },
  {
    version: "0.1.2",
    date: "2026-07-26",
    title: "更新日志栏目",
    summary: "导航新增更新日志，集中记录站点变更，方便对照版本。",
    items: [
      { tag: "新增", text: "侧栏与移动端导航增加「更新日志」入口" },
      { tag: "新增", text: "独立页面 /changelog/，按版本展示变更说明" },
      { tag: "文档", text: "变更条目集中维护于 src/data/changelog.ts" },
    ],
  },
  {
    version: "0.1.1",
    date: "2026-07-26",
    title: "工坊电台与曲库修正",
    summary: "上线网易云随机播放，并修正默认曲目 ID 与实际歌曲不一致的问题。",
    items: [
      { tag: "新增", text: "工坊电台：打开随机播放喜欢曲库中的歌曲" },
      { tag: "新增", text: "支持换一首、曲库点播、网易云官方外链播放器" },
      { tag: "新增", text: "npm run music:sync：从公开歌单同步曲库" },
      { tag: "修复", text: "纠正错误歌曲 ID（如平凡之路误播成 Pianoboy 等）" },
      { tag: "文档", text: "密钥仅存 .env.local，不进入前端与 Git 仓库" },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-07-26",
    title: "飞雪工坊首发",
    summary: "个人 AI 能力展厅上线：首页、展厅、观点、日夜主题，代码托管 GitHub。",
    items: [
      { tag: "新增", text: "站点品牌：飞雪工坊 · 用 AI 重做工作流" },
      { tag: "新增", text: "首页：能力速览、作品切片、原则、联系表单" },
      { tag: "新增", text: "能力展厅、观点精选独立页面" },
      { tag: "新增", text: "侧栏导航 + 日/夜主题切换（记忆本地偏好）" },
      { tag: "新增", text: "视觉对齐工具型深色产品站风格（AI HOT 气质）" },
      { tag: "新增", text: "静态导出配置，可部署腾讯云 CloudBase" },
      { tag: "文档", text: "代码仓库：github.com/howx813/feixueworkshop" },
    ],
  },
];
