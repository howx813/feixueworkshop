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
  icon:
    | "gravity"
    | "fluid"
    | "particles"
    | "graphic"
    | "marble"
    | "snowflake"
    | "life"
    | "fourier"
    | "spectrum"
    | "particle-life"
    | "time-illusion"
    | "ai-2048"
    | "pagoda"
    | "living-room"
    | "text-drop";
  summary: string;
  href: string;
  status: "可玩" | "实验中" | "搁置";
  tags: string[];
  updated: string;
};

export const labItems: LabItem[] = [
  {
    id: "text-drop",
    title: "一字千钧",
    icon: "text-drop",
    summary:
      "输入一段文字，每个字都变成有重量的刚体：自由落体、碰撞翻滚、堆成小山。抓起来扔出去，或反转重力让整段话飞上天。",
    href: "/lab/text-drop/",
    status: "可玩",
    tags: ["物理引擎", "文字", "互动"],
    updated: "2026-08-21",
  },
  {
    id: "living-room",
    title: "3D 客厅",
    icon: "living-room",
    summary:
      "Three.js 搭的客厅：柔和全局光照、真实软阴影、程序生成橡木地板。壁挂电视里，一只猫正永远追不上那只老鼠。",
    href: "/lab/living-room/",
    status: "可玩",
    tags: ["Three.js", "光照", "3D"],
    updated: "2026-08-21",
  },
  {
    id: "pagoda",
    title: "体素宝塔花园",
    icon: "pagoda",
    summary:
      "一座完全可探索的悬浮花园岛：五重塔、樱花、竹林、石灯笼与池塘，全部由种子程序生成。轨道环绕、滚轮推近，零资源加载——每个方块都是一次成形的纯色体素。",
    href: "/lab/pagoda/",
    status: "可玩",
    tags: ["体素", "程序生成", "3D"],
    updated: "2026-08-21",
  },
  {
    id: "ai-2048",
    title: "AI 解 2048",
    icon: "ai-2048",
    summary:
      "expectimax 搜索自动打 2048：空格、单调性、平滑度、大数压角四项启发式。看 AI 把散乱牌面盘成一条蛇，也可以自己玩一半交给它。",
    href: "/lab/ai2048/",
    status: "可玩",
    tags: ["算法", "expectimax", "游戏 AI"],
    updated: "2026-08-21",
  },
  {
    id: "time-illusion",
    title: "时间幻觉",
    icon: "time-illusion",
    summary:
      "爱因斯坦名言叠在星空上，半透明晶体缓缓旋转、连续形变。过去、现在与未来之间的分别，不过是一种顽固的幻觉。",
    href: "/lab/time-illusion/",
    status: "可玩",
    tags: ["Canvas", "3D", "视觉玩具"],
    updated: "2026-08-19",
  },
  {
    id: "particle-life",
    title: "粒子生命",
    icon: "particle-life",
    summary:
      "多色粒子按「谁吸引谁」互动，涌现丝状、团块与轨道。随机规则换一局宇宙——规则极简，好玩在涌现。",
    href: "/lab/particle-life/",
    status: "可玩",
    tags: ["Canvas", "涌现", "物理玩具"],
    updated: "2026-08-19",
  },
  {
    id: "spectrum",
    title: "频谱显微镜",
    icon: "spectrum",
    summary:
      "打开麦克风，实时看自己声音的波形、频谱、瀑布图和音高；没麦也有纯音发生器 + 小键盘。傅里叶页的实操姊妹篇。",
    href: "/lab/spectrum/",
    status: "可玩",
    tags: ["Web Audio", "麦克风", "FFT", "解说词"],
    updated: "2026-08-08",
  },
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
