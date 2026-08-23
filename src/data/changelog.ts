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
    version: "0.2.44",
    date: "2026-08-22",
    title: "手搓宝匣新增「标讯星图」——商机数据 3D 宇宙",
    summary:
      "/lab/tender-galaxy：把商机雷达的真实标讯渲染成可漫游的 3D 星系。行业聚成星团，金额点亮亮度，星级染成颜色；自定义 shader 点精灵 + 加性混合，Raycast 悬停看详情、点击跳原文。",
    items: [
      { tag: "新增", text: "/lab/tender-galaxy：真实标讯数据驱动的 3D 星图" },
      { tag: "新增", text: "行业星团布局 + 悬停详情卡 + 点击跳转原文" },
      { tag: "新增", text: "自定义 GLSL 点精灵（径向光晕）+ 加性混合星云背景" },
    ],
  },
  {
    version: "0.2.43",
    date: "2026-08-22",
    title: "一字千钧：字全部落定后自动引爆",
    summary:
      "/lab/text-drop 所有字落定休眠 1.3 秒后自动引爆成粒子雨，形成「落字 → 看它堆好 → 轰」的循环；手动按钮保留为提前引爆。",
    items: [
      { tag: "新增", text: "落定后 1.3s 自动引爆（≥3 字触发）" },
      { tag: "优化", text: "手动按钮改为提前引爆，随时打断等待" },
    ],
  },
  {
    version: "0.2.42",
    date: "2026-08-22",
    title: "一字千钧新增「引爆成粒子」",
    summary:
      "/lab/text-drop 落好的字堆一键引爆：每个字碎成 7 枚继承配色的粒子四散飞溅（重力+弹地+淡出），配双重冲击波环与全屏闪光帧。",
    items: [
      { tag: "新增", text: "💥 引爆按钮：字堆炸裂为粒子雨" },
      { tag: "新增", text: "冲击波双环扩散 + 爆炸闪光帧" },
    ],
  },
  {
    version: "0.2.41",
    date: "2026-08-21",
    title: "手搓宝匣新增「一字千钧」文字物理沙盒",
    summary:
      "/lab/text-drop：输入一段文字，每个字都变成有重量的刚体——自由落体、碰撞翻滚、堆成小山。零依赖手写 2D 物理引擎（空间哈希 + 迭代求解 + 沉降休眠），支持拖拽抛掷与重力反转。",
    items: [
      { tag: "新增", text: "/lab/text-drop：逐字落下 + 刚体碰撞堆叠，上限 200 字" },
      { tag: "新增", text: "抓取抛掷交互：甩出去的字带真实惯性" },
      { tag: "新增", text: "重力反转：让整段话飞上天再落回来" },
      { tag: "文档", text: "物理引擎单测 9 项（穿隧/堆叠/沉降/越界）纳入 test:unit" },
    ],
  },
  {
    version: "0.2.40",
    date: "2026-08-21",
    title: "修复体素花园上下颠倒",
    summary:
      "/lab/pagoda 相机 right 向量叉乘方向写反，导致 up 朝下、整个世界倒挂。已修正为 fwd × worldUp，像素级验证草地沉底、塔尖朝上。",
    items: [
      { tag: "修复", text: "体素花园世界上下颠倒（相机 up 向量方向错误）" },
    ],
  },
  {
    version: "0.2.39",
    date: "2026-08-21",
    title: "手搓宝匣新增「3D 客厅」Three.js 光照场景",
    summary:
      "/lab/living-room：Three.js 打造的客厅——柔和全局光照、PCF 软阴影、Canvas 程序绘制的橡木地板，壁挂电视用 CanvasTexture 实时播放猫鼠追逐动画。",
    items: [
      { tag: "新增", text: "/lab/living-room：沙发/茶几/电视柜/落地灯/绿植全套家具" },
      { tag: "新增", text: "程序化橡木地板（板条+木纹+错缝拼花，零贴图资源）" },
      { tag: "新增", text: "电视屏幕实时动画：猫追老鼠绕屋狂奔 + 扫描线质感" },
      { tag: "新增", text: "PCF 软阴影 + 三光源布光（日光/落地灯/电视辉光）" },
    ],
  },
  {
    version: "0.2.38",
    date: "2026-08-21",
    title: "手搓宝匣新增「体素宝塔花园」程序生成体素世界",
    summary:
      "/lab/pagoda：完全可探索的悬浮花园岛——五重塔、樱花、竹林、石灯笼与池塘，全部由种子程序生成。轨道相机环绕缩放，隐藏面剔除 + 逐帧深度排序，零资源加载。",
    items: [
      { tag: "新增", text: "/lab/pagoda：种子确定性生成，换一颗种子就是另一座花园" },
      { tag: "新增", text: "轨道相机：拖拽环绕、滚轮缩放、自动缓转可开关" },
      { tag: "新增", text: "手写 3D 管线：背面剔除 + painter's algorithm 深度排序 + Lambert 面光照" },
      { tag: "文档", text: "世界生成器单测 9 项（确定性/无重复/结构完整）纳入 test:unit" },
    ],
  },
  {
    version: "0.2.37",
    date: "2026-08-21",
    title: "手搓宝匣新增「AI 解 2048」游戏 AI 演示",
    summary:
      "/lab/ai2048：expectimax 搜索 + 四项启发式评估（空格/单调性/平滑度/大数压角），AI 自动打穿 2048，种子局实测稳定通关。可调速度观战，也可自己玩一半交给 AI 接盘。",
    items: [
      { tag: "新增", text: "/lab/ai2048：expectimax 游戏 AI，深度随局面自适应" },
      { tag: "新增", text: "四档速度观战 + 分数/步数/最大块实时统计" },
      { tag: "新增", text: "方向键手动模式，随时让 AI 接管或收回" },
      { tag: "文档", text: "引擎与 AI 单测 13 项（含种子局通关验证）纳入 test:unit" },
    ],
  },
  {
    version: "0.2.36",
    date: "2026-08-21",
    title: "流体实验室升级：CPU 求解器换 GPU 着色器渲染",
    summary:
      "/lab/fluid 从 128 网格 CPU 模拟升级为 WebGL GPU 加速的 Navier-Stokes 求解器（基于 Pavel Dobryakov 的 MIT 开源实现改造），高清染料、实时涡旋，新增笔刷/残留/旋度/变色四项实时调参与随机泼溅。",
    items: [
      { tag: "优化", text: "流体实验室核心换 WebGL 着色器渲染，画质与流畅度提升一个量级" },
      { tag: "新增", text: "笔刷大小、染料残留、涡旋强度、色彩流速四项实时参数调节" },
      { tag: "新增", text: "随机泼溅按钮与空格键快捷泼溅、P 键暂停" },
      { tag: "优化", text: "WebGL 不可用时自动降级提示" },
    ],
  },
  {
    version: "0.2.35",
    date: "2026-08-19",
    title: "手搓宝匣新增「时间幻觉」晶体变形视觉玩具",
    summary:
      "/lab/time-illusion：复刻星空 + 半透明晶体连续形变短视频；爱因斯坦中英名言叠层，细分八面体径向位移，可调形变强度与转速。",
    items: [
      { tag: "新增", text: "/lab/time-illusion：星空背景 + 半透明晶体旋转形变 + 名言叠层" },
      { tag: "新增", text: "crystal-morph-core：细分八面体网格、径向噪声位移、投影与面光照" },
      { tag: "新增", text: "宝匣清单、LabIcon、首页 showcase 注册 time-illusion 条目" },
    ],
  },
  {
    version: "0.2.34",
    date: "2026-08-09",
    title: "访问分析同步改增量版，API 消耗降到 ≈1 次/天",
    summary:
      "analytics:sync 重构：JSON 内保存按天聚合历史（schema v2），每次只补拉新日子——重复运行 0 消耗、漏跑自动补；砍掉 /trend/day 调用，UV/IP 改从访问明细 uuid/ip 去重聚合。稳态 ≈30 次/月（免费配额 100 次内），前端栏目无需改动。",
    items: [
      { tag: "优化", text: "增量同步：coveredTo 游标 + daily 历史库，重复运行 0 次 API 调用" },
      { tag: "优化", text: "不再调趋势接口：UV/IP 从明细去重计算，每次同步省 1 次调用" },
    ],
  },
  {
    version: "0.2.33",
    date: "2026-08-08",
    title: "工作周报新增「访问分析」栏目（51la OpenAPI）",
    summary:
      "/weekly 密码门后新增访问分析：周总量（UV/PV/IP/新访客）、7 日 PV 趋势、访客地区排行。数据由 scripts/sync-analytics.mjs 本地同步（51la /trend/day + /visitor/detail/list，密钥读 .env.local 不进仓库），地区为聚合统计、不含任何 IP。",
    items: [
      { tag: "新增", text: "analytics:sync 脚本：51la 签名调用 + 地区聚合 → public/data/site-analytics.json" },
      { tag: "新增", text: "周报页访问分析栏目：总量卡片 + 趋势柱 + 地区条形排行（数据缺失时自动隐藏）" },
      { tag: "文档", text: ".env.example 增加 LA51_ACCESS_KEY/LA51_SECRET_KEY/LA51_MASK_ID 说明（免费配额 100 次/月）" },
    ],
  },
  {
    version: "0.2.32",
    date: "2026-08-08",
    title: "手搓宝匣新增「频谱显微镜」（傅里叶实操姊妹篇）",
    summary:
      "/lab/spectrum：麦克风实时声音分析——示波器+频谱柱（对数轴）、瀑布频谱彩虹河、音高表（自相关估基频+音分表盘）、纯音发生器+钢琴小键盘；麦克风不可用时发生器驱动全部仪器。每节配解说词可朗读，与傅里叶页互跳。",
    items: [
      { tag: "新增", text: "/lab/spectrum 四仪器：示波器+频谱 / 瀑布频谱 / 音高表 / 发生器+键盘" },
      { tag: "新增", text: "src/lib/pitch.ts 音高识别（ACF+抛物线插值）+ test-pitch 单测挂入 test:unit" },
      { tag: "优化", text: "抽取共享 demokit.tsx（AnimCanvas/usePalette/Narration），傅里叶页迁移复用" },
    ],
  },
  {
    version: "0.2.31",
    date: "2026-08-08",
    title: "手搓宝匣新增「傅里叶变换，一次讲透」动画解说页",
    summary:
      "/lab/fourier：三段联动 Canvas 动画（纯音搭积木、旋转圆 epicycles 画方波、时域⇄频域联动实验室），每节配解说词卡片，可用浏览器内置语音朗读；讲清时域/频域与傅里叶变换的用途（MP3/JPEG/降噪/5G/CT/FFT）。",
    items: [
      { tag: "新增", text: "/lab/fourier 动画解说页：三动画 + 解说词 + TTS 朗读按钮" },
      { tag: "新增", text: "时域⇄频域联动实验室：方波/锯齿波/三角波切换 + 谐波数滑杆 + 频谱柱" },
      { tag: "新增", text: "宝匣清单与 LabIcon 注册 fourier 条目（波形+频谱柱图标）" },
    ],
  },
  {
    version: "0.2.30",
    date: "2026-08-01",
    title: "导航新增「工作周报」入口",
    summary:
      "侧边栏「内容」组与手机底部导航新增 /weekly 工作周报入口（日历图标），周报页不再只是隐藏链接。",
    items: [
      { tag: "新增", text: "侧边栏导航「工作周报」入口（每日标讯与更新日志之间）" },
      { tag: "新增", text: "手机底部导航加「周报」标签" },
    ],
  },
  {
    version: "0.2.29",
    date: "2026-08-01",
    title: "/weekly 改为工作周报（内容主体移交 Hermes）",
    summary:
      "周报定位修正：/weekly 是飞雪的一周工作周报，正文由 Hermes 侧撰写（docs/weekly-hub/<周>.work.md 投放，生成器自动合并）；标讯内容移出周报，标讯雷达留在 /tenders 独立发展。密码查看与一键复制保留。",
    items: [
      { tag: "优化", text: "/weekly 重做：工作周报渲染（markdown-lite 标题/列表/引用），标讯内容全部移出" },
      { tag: "新增", text: "合并契约 docs/weekly-hub/<week>.work.md：DeepSeek 写正文 → tenders:weekly-site 合并上线" },
      { tag: "优化", text: "页脚保留工坊 AI 运行健康一行；标讯雷达数据不再进入周报" },
    ],
  },
  {
    version: "0.2.28",
    date: "2026-08-01",
    title: "/weekly 招标周报页（密码查看 + 一键复制）",
    summary:
      "新开 /weekly 页面：招标周报每周五 18:00 更新，简单明了版——解读、概览数字、5★ 值得盯、临近截止、异动升温、数据健康；输入密码查看，一键复制纯文本摘要方便粘贴飞书/微信。数据源 tenders:weekly-site 生成器（标讯 facts + AI 运行记账 + 可选模型解读合并）。",
    items: [
      { tag: "新增", text: "/weekly 周报页：密码门（软门禁）+ 会话内免重复输入 + robots noindex" },
      { tag: "新增", text: "一键复制：copyText 纯文本摘要（概览/5★/临近截止/异动/健康），含剪贴板兜底" },
      { tag: "新增", text: "tenders:weekly-site 生成器：facts + agent-activity + insight.md 三方合并，积累期自动隐藏异动虚高" },
    ],
  },
  {
    version: "0.2.27",
    date: "2026-08-01",
    title: "周报底座生成器（商机雷达 M4 前置）",
    summary:
      "新增 tenders:weekly：标讯历史库 → 周报事实层（概览数字 / 值得盯清单 / 行业地域异动候选 / 数据健康），输出 facts.json + Markdown 骨架；「本周解读」占位由模型撰写。配套编排层切换：每日同步改由本机 cron 接管，GitHub Actions 每日抓取停用（保留手动备用）。",
    items: [
      { tag: "新增", text: "scripts/weekly-bid-report.mjs：默认报上一完整周，支持 --week=current / YYYY-Www" },
      { tag: "新增", text: "周报事实层口径：环比满 5 天开启、行业仅精匹配口径、临近截止表截断前 15 条" },
      { tag: "新增", text: "周报生成器单测 7 组纳入 test:unit" },
      { tag: "优化", text: "每日标讯同步改由本机 cron 接管（GHA 每日抓取停用，launchd 退役），撞车窗口关闭" },
    ],
  },
  {
    version: "0.2.26",
    date: "2026-08-01",
    title: "标讯趋势看板与 AI 日报（商机雷达 M2）",
    summary:
      "每日标讯页新增趋势区块：近 12 周新增/在途/出窗三态走势、地域/行业/金额分布、5★ 高星榜单，随每日同步热更新；页顶新增「工坊 AI 日报」卡片，展示标讯 agent 最近一次同步结果。",
    items: [
      { tag: "新增", text: "趋势聚合管线 tenders:aggregate：历史库 → 双写 src/data 与 public/data，页面首屏 + 运行时热刷" },
      { tag: "新增", text: "/tenders 趋势区块（三态走势/地域/行业/金额/5★ 榜）与「工坊 AI 日报」卡片，零新增依赖" },
      { tag: "新增", text: "预检 5/8：趋势产物双写一致性 + 防 stale 校验；聚合单测 9 组纳入 test:unit" },
      { tag: "优化", text: "tenders:daily 链路挂上聚合，历史库与运行记账一并提交" },
    ],
  },
  {
    version: "0.2.25",
    date: "2026-08-01",
    title: "标讯历史留痕（商机雷达 M1）",
    summary:
      "每日标讯同步开始事件溯源留痕：精匹配明细 + 宽口径计数按月分片 JSONL 纯追加入库，同步成败均记账。历史库是后续趋势分析与 AI 工作日报的地基。",
    items: [
      { tag: "新增", text: "data/tenders-history/ 按月分片 JSONL 历史库（只追加不重写，派生字段聚合期计算）" },
      { tag: "新增", text: "data/agent-activity.jsonl 同步记账：成功记条数，失败记错误摘要，中断也留痕" },
      { tag: "新增", text: "tender-history 模块单测并纳入 test:unit（分片/纯追加/坏行容错/字段裁剪）" },
    ],
  },
  {
    version: "0.2.24",
    date: "2026-07-29",
    title: "生命游戏上线",
    summary:
      "手搓宝匣新增康威生命游戏：可交互的元胞自动机演示，支持播放/暂停/步进、随机填充、三种经典图案（滑翔机/脉冲星/滑翔机枪）、点击拖拽绘制细胞。",
    items: [
      { tag: "新增", text: "/lab/life 康威生命游戏：B3/S23 规则、Canvas 实时渲染" },
      { tag: "新增", text: "三种经典图案一键加载：滑翔机、脉冲星、高斯帕滑翔机枪" },
      { tag: "新增", text: "速度滑杆、代数计数、点击拖拽绘制细胞" },
    ],
  },
  
  {
    version: "0.2.23",
    date: "2026-07-27",
    title: "展厅文案更新成「现在进行时」",
    summary:
      "首页与展厅页的「作品切片」不再写 v0.1 时代的三件原型，换成手搓宝匣 6 个真实可玩的实验（碎砖弹珠 / 引力沙盘 / 流体实验室 / 字由粒子 / 图像小说 / 雪花函数），卡片标题可直接点进实验页。",
    items: [
      { tag: "优化", text: "showcases 整体替换为 6 个可玩实验，附真实亮点与技术栈" },
      { tag: "新增", text: "作品卡片标题链接直达对应实验页" },
    ],
  },
  {
    version: "0.2.22",
    date: "2026-07-27",
    title: "碎砖弹珠：签名公司爆炸效果",
    summary:
      "弹珠打穿砖块时，签名公司 logo 会炸开：切成多块向外飞散、旋转、受重力下坠并淡出，配合青色冲击波和碎屑粒子；普通命中也有小火花。",
    items: [
      { tag: "新增", text: "logo 碎片爆炸：按宽高比切 6~8 块，各自飞散旋转下坠" },
      { tag: "新增", text: "冲击波光环 + 碎屑粒子 + 命中火花" },
    ],
  },
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
