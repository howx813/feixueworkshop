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
  icon: "fluid" | "particles" | "graphic" | "marble" | "snowflake";
  summary: string;
  href: string;
  status: "可玩" | "实验中" | "搁置";
  tags: string[];
  updated: string;
};

export const labItems: LabItem[] = [
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
      "弹珠打砖：弹出去打碎上方砖块，砖块掉落多球、加宽、慢速、火力、生命等道具。",
    href: "/lab/marble/",
    status: "可玩",
    tags: ["游戏", "Canvas", "街机"],
    updated: "2026-07-26",
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
