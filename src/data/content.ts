export const site = {
  name: "飞雪工坊",
  nameEn: "Feixue Workshop",
  slogan: "用 AI 重做工作流",
  description:
    "飞雪的个人 AI 能力展厅：数据智能、智能体提效、科创方法与可演示作品。",
  owner: "飞雪",
  emailPlaceholder: "hello@feixue.workshop",
  /** 首页人设（展厅气质：5 秒说清是谁） */
  heroGreeting: "你好，我是飞雪",
  heroLead:
    "用 AI 重做工作流。这里是能力展厅、可玩实验，以及真实办公链路里的工具。",
};

/** 首页三入口：看人 / 看作品 / 看工具 */
export const homeDoors = [
  {
    id: "showcase",
    href: "/showcase/",
    label: "能力展厅",
    hint: "数据智能 · 智能体 · 科创方法",
  },
  {
    id: "lab",
    href: "/lab/",
    label: "手搓宝匣",
    hint: "点开就能玩的实验",
  },
  {
    id: "tools",
    href: "/tenders/",
    label: "工作台",
    hint: "每日标讯 · 工作周报",
  },
] as const;

export type Capability = {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  points: string[];
  status: "可演示" | "进行中" | "规划中";
  tags: string[];
};

export const capabilities: Capability[] = [
  {
    id: "data-intel",
    title: "数据智能",
    subtitle: "把零散数据变成可决策的视图",
    summary:
      "面向产业与科创场景，做数据清洗、指标口径梳理、看板与分析报告。重点不是堆图表，而是让人在 30 秒内看懂现状。",
    points: [
      "业务指标分层：现象 / 原因 / 动作",
      "轻量看板与静态导出部署",
      "调研报告与讲座版材料联动",
    ],
    status: "可演示",
    tags: ["数据分析", "看板", "产业服务"],
  },
  {
    id: "agent-ops",
    title: "智能体提效",
    subtitle: "让 Agent 进入真实办公链路",
    summary:
      "把任务、日历、文档、消息串成可执行工作流。目标不是“会聊天”，而是少开会、少抄写、少丢待办。",
    points: [
      "飞书任务 / 日程 / 文档协同",
      "会议纪要与待办抽取",
      "人机分工：AI 起草，人拍板",
    ],
    status: "进行中",
    tags: ["Agent", "飞书", "办公自动化"],
  },
  {
    id: "innovation-method",
    title: "科创方法",
    subtitle: "把项目推进拆成可复用方法",
    summary:
      "从材料写作、汇报结构到项目拆解，沉淀可复制的方法模板。适合中期检查、重点任务推进、对外讲解场景。",
    points: [
      "汇报结构：结论先行、证据支撑",
      "材料母版：提纲 → 正文 → 讲稿",
      "项目拆解：目标 / 路径 / 代价",
    ],
    status: "可演示",
    tags: ["方法论", "材料", "项目管理"],
  },
];

export type ShowcaseItem = {
  id: string;
  title: string;
  role: string;
  summary: string;
  highlights: string[];
  stack: string[];
  stage: string;
  /** 可演示地址（手搓宝匣实验页） */
  href?: string;
};

export const showcases: ShowcaseItem[] = [
  {
    id: "pagoda",
    title: "体素宝塔花园",
    role: "程序生成 / 体素世界",
    summary:
      "种子进、花园出：五重塔与樱花庭院完全由程序生成，轨道相机自由环绕。隐藏面剔除 + 逐帧深度排序，零资源加载跑在任意标签页里。",
    highlights: ["种子确定性生成", "隐藏面剔除渲染", "轨道相机交互"],
    stack: ["Canvas", "TypeScript"],
    stage: "可玩",
    href: "/lab/pagoda/",
  },
  {
    id: "ai-2048",
    title: "AI 解 2048",
    role: "游戏 AI / 算法演示",
    summary:
      "expectimax 搜索 + 四项启发式评估（空格/单调性/平滑度/压角），AI 自动打穿 2048。种子局实测稳定通关，可随时接管手动玩。",
    highlights: ["expectimax 深度自适应", "启发式评估函数", "人机随时接盘"],
    stack: ["TypeScript", "Expectimax"],
    stage: "可玩",
    href: "/lab/ai2048/",
  },
  {
    id: "time-illusion",
    title: "时间幻觉",
    role: "视觉玩具 / 短视频复刻",
    summary:
      "爱因斯坦名言叠在星空上，半透明晶体缓缓旋转、连续形变。过去、现在与未来之间的分别，不过是一种顽固的幻觉。",
    highlights: ["细分八面体 + 径向形变", "半透明切面光照", "可调形变强度与转速"],
    stack: ["Canvas", "TypeScript"],
    stage: "可玩",
    href: "/lab/time-illusion/",
  },
  {
    id: "particle-life",
    title: "粒子生命",
    role: "涌现模拟 / 玩具",
    summary:
      "多色粒子按随机吸引/排斥规则互动，自己长出丝、团与轨道。点随机规则换一局宇宙。",
    highlights: ["规则极简", "图案涌现", "可调力与半径"],
    stack: ["Canvas", "TypeScript"],
    stage: "可玩",
    href: "/lab/particle-life/",
  },
  {
    id: "marble",
    title: "碎砖弹珠 · Anthropic 打签名墙",
    role: "街机游戏 / 热点二创",
    summary:
      "黄仁勋发起 AI 开源签名，50 家都签了——只有 Anthropic 没签。你是 ANTHROPIC 字标挡板，把弹珠发出去，炸开整面签名墙。砖块 logo 全部裁自原梗图视频。",
    highlights: [
      "50 个真签名方 logo 砖块，掉血变淡",
      "爆炸特效：logo 碎块飞散 + 冲击波 + 粒子",
      "道具系统：多球 / 加宽 / 慢速 / 火力 / 生命",
    ],
    stack: ["Next.js", "Canvas", "TypeScript"],
    stage: "可玩",
    href: "/lab/marble/",
  },
  {
    id: "gravity",
    title: "引力沙盘",
    role: "物理模拟 / 交互",
    summary:
      "一道粒子风横穿屏幕，放下的质量点像引力透镜一样把流线掰弯；可切排斥，看流场实时重排。",
    highlights: ["流场 + 引力透镜实时叠加", "吸引 / 排斥一键切换", "纯 Canvas，零依赖"],
    stack: ["Canvas", "物理模拟", "TypeScript"],
    stage: "可玩",
    href: "/lab/gravity/",
  },
  {
    id: "fluid",
    title: "流体实验室",
    role: "物理模拟 / 可视化",
    summary:
      "实时 Navier-Stokes 流体模拟：注入染料，看扩散、涡旋与对流在指尖成形。",
    highlights: ["NS 方程实时求解", "染料注入与涡旋演化", "鼠标直接搅动流场"],
    stack: ["Canvas", "NS 方程", "TypeScript"],
    stage: "可玩",
    href: "/lab/fluid/",
  },
  {
    id: "particles",
    title: "字由粒子",
    role: "交互动画 / 粒子",
    summary:
      "汉字化作万千粒子，鼠标一扫散开，静止后自动聚回成字。",
    highlights: ["汉字点阵化采样", "散开 / 聚合的弹性回归", "粒子级交互反馈"],
    stack: ["Canvas", "粒子系统", "TypeScript"],
    stage: "可玩",
    href: "/lab/particles/",
  },
  {
    id: "graphic",
    title: "图像小说",
    role: "内容实验 / 阅读",
    summary: "五本中文传记各十页：真封面、真容、页下中文原文。",
    highlights: ["五本中文传记", "每本十页图文", "封面与正文分离排版"],
    stack: ["Next.js", "静态内容"],
    stage: "实验中",
    href: "/lab/graphic/",
  },
  {
    id: "snowflake",
    title: "雪花函数",
    role: "数学玩具 / SVG",
    summary:
      "科赫雪花（Koch）：等边三角形上递归折尖角，本站导航 logo 也是它生成的。",
    highlights: ["分形递归可视化", "迭代层级可调", "站点 logo 同源生成"],
    stack: ["SVG", "分形", "TypeScript"],
    stage: "可玩",
    href: "/lab/snowflake/",
  },
];

export type Insight = {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  takeaway: string;
};

export const insights: Insight[] = [
  {
    id: "llm-evolution-2026",
    title: "大模型进化：从会回答到会办事",
    date: "2026",
    category: "AI 判断",
    summary:
      "模型能力在涨，真正拉开差距的是工作流嵌入深度。能调用工具、能记住约束、能交付结果，才算进入生产。",
    takeaway: "优先做“可验收的任务闭环”，而不是再做一个聊天框。",
  },
  {
    id: "data-labeling",
    title: "数据标注业务：苦活里的结构性机会",
    date: "2026",
    category: "产业观察",
    summary:
      "标注不是低端外包的代名词。质量体系、场景拆解、交付管理，决定了它能不能从人力生意升级为数据服务能力。",
    takeaway: "卖的不是人头，是可复用的数据生产工艺。",
  },
  {
    id: "data-service-path",
    title: "数据服务切入：先证明一次可复制",
    date: "2026",
    category: "方法",
    summary:
      "产业服务最怕一开始就铺大平台。更稳的路径是：选一个痛、打穿一次、沉淀模板、再横向复制。",
    takeaway: "先做单点样板，再谈平台叙事。",
  },
  {
    id: "fde-mode",
    title: "FDE 模式：把交付工程师推到问题现场",
    date: "2026",
    category: "组织与交付",
    summary:
      "Forward Deployed Engineer 的价值，是把产品能力带进真实约束里改。对 B 端和政企场景，这往往比远程猜需求更有效。",
    takeaway: "现场理解约束，比远程堆功能更值钱。",
  },
];

export const principles = [
  {
    title: "目标优先于动作",
    desc: "先问为什么做，再谈怎么做。路径不对就换，不硬扛。",
  },
  {
    title: "能交付才算能力",
    desc: "演示可以炫，真正算数的是能不能稳定产出结果。",
  },
  {
    title: "先短后全",
    desc: "最小可用版本先上线，再按真实反馈加深度。",
  },
];
