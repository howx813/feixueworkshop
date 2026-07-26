/**
 * 手搓匣 —— 灵机一动的小玩意清单
 * 新实验往数组顶部加一条即可。
 */
export const labMeta = {
  name: "手搓匣",
  nameEn: "Scratch Box",
  slogan: "灵机一动，随手做出来",
  description:
    "放一些手搓的小软件、数学玩具和半成品想法。不求完整，只求好玩、能点开。",
};

export type LabItem = {
  id: string;
  title: string;
  summary: string;
  href: string;
  status: "可玩" | "实验中" | "搁置";
  tags: string[];
  updated: string;
};

export const labItems: LabItem[] = [
  {
    id: "graphic",
    title: "图像小说",
    summary: "五本中文传记各十页：真封面、真容、页下中文原文。",
    href: "/lab/graphic/",
    status: "实验中",
    tags: ["图像小说"],
    updated: "2026-07-26",
  },
  {
    id: "marble",
    title: "碎砖弹珠",
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
    summary:
      "科赫雪花（Koch）：等边三角形上递归折尖角，导航 logo 也是它生成的。",
    href: "/lab/snowflake/",
    status: "可玩",
    tags: ["数学", "分形", "SVG"],
    updated: "2026-07-26",
  },
];
