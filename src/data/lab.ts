/**
 * 手搓宝匣 —— 灵机一动的小玩意清单
 * 新实验往数组顶部加一条即可。
 */
export const labMeta = {
  name: "手搓宝匣",
  nameEn: "Scratch Box",
  slogan: "灵机一动，随手做出来",
  description:
    "放一些手搓的小软件、数学玩具和半成品想法。不求完整，只求好玩、能点开。",
};

export type LabItem = {
  id: string;
  title: string;
  /** 应用名称前的 SVG 图标标识 */
  icon: "gravity" | "fluid" | "particles" | "graphic" | "marble" | "snowflake" | "life" | "fourier";
  summary: string;
  href: string;
  status: "可玩" | "实验中" | "搁置";
  tags: string[];
  updated: string;
};

export const labItems: LabItem[] = [
  {
    id: "fourier",
    title: "傅里叶变换，一次讲透",
    icon: "fourier",
    summary:
      "三段联动动画 + 可朗读解说词：纯音搭积木、旋转圆画方波、时域⇄频域实验室，讲清它到底用来干嘛。",
    href: "/lab/fourier/",
    status: "可玩",
    tags: ["数学", "动画", "解说词", "信号"],
    updated: "2026-08-08",
  },
  {
    id: "life",
    title: "生命游戏",
    icon: "life",
    summary: "康威生命游戏：元胞自动机的经典演示，播种、观察演化、加载经典图案。",
    href: "/lab/life/",
    status: "可玩",
    tags: ["Canvas", "元胞自动机", "模拟"],
    updated: "2026-07-28",
  },
  {
    id: "gravity",
    title: "引力沙盘",
    icon: "gravity",
    summary:
      "一道粒子风横穿屏幕，放下的质量点像引力透镜一样把流线掰弯；可切排斥。",
    href: "/lab/gravity/",
    status: "可玩",
    tags: ["Canvas", "物理模拟", "引力"],
    updated: "2026-07-27",
  },
  {
    id: "fluid",
    title: "流体实验室",
    icon: "fluid",
    summary: "实时 Navier-Stokes 流体模拟：注入染料，看扩散、涡旋与对流。",
    href: "/lab/fluid/",
    status: "可玩",
    tags: ["Canvas", "物理模拟", "NS 方程"],
    updated: "2026-07-26",
  },
  {
    id: "particles",
    title: "字由粒子",
    icon: "particles",
    summary: "汉字化作万千粒子，鼠标一扫散开，静止后自动聚回成字。",
    href: "/lab/particles/",
    status: "可玩",
    tags: ["Canvas", "交互", "粒子"],
    updated: "2026-07-26",
  },
  {
    id: "graphic",
    title: "图像小说",
    icon: "graphic",
    summary: "五本中文传记各十页：真封面、真容、页下中文原文。",
    href: "/lab/graphic/",
    status: "实验中",
    tags: ["图像小说"],
    updated: "2026-07-26",
  },
  {
    id: "marble",
    title: "碎砖弹珠",
    icon: "marble",
    summary:
      "Anthropic 打签名墙：你是唯一没响应黄仁勋 AI 开源签名的字标挡板，弹珠打掉 50 家签了名的公司 logo。",
    href: "/lab/marble/",
    status: "可玩",
    tags: ["游戏", "Canvas", "街机"],
    updated: "2026-07-27",
  },
  {
    id: "snowflake",
    title: "雪花函数",
    icon: "snowflake",
    summary:
      "科赫雪花（Koch）：等边三角形上递归折尖角，导航 logo 也是它生成的。",
    href: "/lab/snowflake/",
    status: "可玩",
    tags: ["数学", "分形", "SVG"],
    updated: "2026-07-26",
  },
];
