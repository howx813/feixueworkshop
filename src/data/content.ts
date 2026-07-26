export const site = {
  name: "飞雪工坊",
  nameEn: "Feixue Workshop",
  slogan: "用 AI 重做工作流",
  description:
    "飞雪的个人 AI 能力展厅：数据智能、智能体提效、科创方法与可演示作品。",
  owner: "飞雪",
  emailPlaceholder: "hello@feixue.workshop",
};

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
};

export const showcases: ShowcaseItem[] = [
  {
    id: "datav",
    title: "产业数据看板原型",
    role: "数据展示 / 决策辅助",
    summary:
      "将产业与业务指标做成可讲解的可视化界面，服务汇报与快速摸底。强调口径清晰、页面克制、结论可读。",
    highlights: [
      "多面板指标总览",
      "适合投屏讲解的信息密度",
      "可演进为在线托管版本",
    ],
    stack: ["Next.js", "TypeScript", "Tailwind"],
    stage: "原型可演示",
  },
  {
    id: "paper-agent",
    title: "材料与论文助手",
    role: "写作提效 / 结构生成",
    summary:
      "围绕开题、报告、新闻稿等高频材料，先搭结构再填内容，减少空话与模板腔。",
    highlights: [
      "提纲生成与段落重组",
      "事实 / 占位 / 待确认分层",
      "适合公文与技术文档混合场景",
    ],
    stack: ["Python", "LLM", "结构化提示"],
    stage: "方法可用",
  },
  {
    id: "agent-bridge",
    title: "办公 Agent 桥接",
    role: "任务联动 / 消息协同",
    summary:
      "把终端助手与即时通讯、任务系统打通，让“说一句要做的事”能落到可追踪任务。",
    highlights: [
      "任务创建与截止日抽取",
      "日程与待办双轨",
      "可扩展到群聊与审批提醒",
    ],
    stack: ["CLI", "飞书开放能力", "工作流"],
    stage: "内测迭代",
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
