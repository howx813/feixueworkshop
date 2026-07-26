/**
 * 图像小说成片书目 · 各 10 页
 * 第 1 页：中文版实体书封面；页下 caption 用中文书中可核原文（无括号出处）
 */

export type GraphicPanel = {
  id: string;
  page: number;
  title: string;
  caption: string;
  beat: string;
  image: string;
};

export type GraphicNovel = {
  id: string;
  title: string;
  pages: GraphicPanel[];
};

/**
 * 中信版《史蒂夫·乔布斯传》· 纪实图像小说 10 页
 * 阿兰的战争体：分镜格内嵌长旁白，图文一体（非插图+说明文）
 */
export const jobsNovel: GraphicNovel = {
  id: "jobs",
  title: "史蒂夫·乔布斯传",
  pages: [
    {
      id: "jobs-01",
      page: 1,
      title: "封面",
      caption: "史蒂夫·乔布斯传",
      beat: "封面",
      image: "/graphic/jobs/01.jpg",
    },
    {
      id: "jobs-02",
      page: 2,
      title: "被遗弃与被选择",
      caption:
        "这一切在我出生之前就已注定……这就是我人生的开始。他的生母坚持把孩子交给大学毕业生收养，结果养父母都没有大学学位。",
      beat: "被遗弃与被选择",
      image: "/graphic/jobs/02.jpg",
    },
    {
      id: "jobs-03",
      page: 3,
      title: "硅谷",
      caption:
        "他在加利福尼亚长大。养父在车库里教他拆装电器。硅谷的硬件文化，就在这些不起眼的木门后面慢慢成形。",
      beat: "硅谷",
      image: "/graphic/jobs/03.jpg",
    },
    {
      id: "jobs-04",
      page: 4,
      title: "两个史蒂夫",
      caption:
        "他认识了沃兹尼亚克。一个把世界看成逻辑门，一个把世界看成体验。他们一起做了蓝盒子。",
      beat: "两个史蒂夫",
      image: "/graphic/jobs/04.jpg",
    },
    {
      id: "jobs-05",
      page: 5,
      title: "书法",
      caption:
        "我学的是衬线与无衬线字体，以及不同字母组合间的字间距，还有如何作出完美的版式。十年后设计麦金塔时，它们全都用上了。",
      beat: "书法",
      image: "/graphic/jobs/05.jpg",
    },
    {
      id: "jobs-06",
      page: 6,
      title: "车库",
      caption:
        "苹果公司在乔布斯父母位于洛斯阿尔托斯的车库里诞生。没有大理石门厅，只有半开的车库门与一块电路板。",
      beat: "车库",
      image: "/graphic/jobs/06.jpg",
    },
    {
      id: "jobs-07",
      page: 7,
      title: "个人计算机",
      caption:
        "个人计算机不该只是工程师的玩具。我们要在个人计算机领域留下自己的印记。",
      beat: "个人计算机",
      image: "/graphic/jobs/07.jpg",
    },
    {
      id: "jobs-08",
      page: 8,
      title: "一九八四",
      caption:
        "麦金塔被设计成「为每一个人准备的计算机」。旁白宣布：1984 不会是《1984》。",
      beat: "一九八四",
      image: "/graphic/jobs/08.jpg",
    },
    {
      id: "jobs-09",
      page: 9,
      title: "离开",
      caption:
        "我被自己创建的公司炒了鱿鱼。他创办 NeXT，投资皮克斯——被驱逐反而是一剂最苦的药。",
      beat: "离开",
      image: "/graphic/jobs/09.jpg",
    },
    {
      id: "jobs-10",
      page: 10,
      title: "求知若饥",
      caption:
        "在斯坦福毕业典礼上，他讲了三个故事。求知若饥，虚心若愚。",
      beat: "求知若饥",
      image: "/graphic/jobs/10.jpg",
    },
  ],
};

export const muskNovel: GraphicNovel = {
  id: "musk",
  title: "埃隆·马斯克传",
  pages: [
  {
    id: "musk-01",
    page: 1,
    title: "封面",
    caption: "埃隆·马斯克传",
    beat: "封面",
    image: "/graphic/musk/01.jpg",
  },
  {
    id: "musk-02",
    page: 2,
    title: "比勒陀利亚",
    caption: "童年在南非比勒陀利亚度过，他沉浸在科幻与阅读里。",
    beat: "比勒陀利亚",
    image: "/graphic/musk/02.jpg",
  },
  {
    id: "musk-03",
    page: 3,
    title: "北美与创业",
    caption: "他来到北美，先后参与创立 Zip2 与在线支付事业。",
    beat: "北美与创业",
    image: "/graphic/musk/03.jpg",
  },
  {
    id: "musk-04",
    page: 4,
    title: "火星与火箭",
    caption: "他相信人类应当成为多行星物种。",
    beat: "火星与火箭",
    image: "/graphic/musk/04.jpg",
  },
  {
    id: "musk-05",
    page: 5,
    title: "特斯拉",
    caption: "电动车不应只是环保姿态，而要成为人们真正想要的产品。",
    beat: "特斯拉",
    image: "/graphic/musk/05.jpg",
  },
  {
    id: "musk-06",
    page: 6,
    title: "发射与失败",
    caption: "早期火箭多次失败，团队在废墟上继续下一次发射。",
    beat: "发射与失败",
    image: "/graphic/musk/06.jpg",
  },
  {
    id: "musk-07",
    page: 7,
    title: "回收与着陆",
    caption: "助推器可以回收，钢铁也可以学会回家。",
    beat: "回收与着陆",
    image: "/graphic/musk/07.jpg",
  },
  {
    id: "musk-08",
    page: 8,
    title: "超级工厂",
    caption: "超级工厂把产能与成本推到极限。",
    beat: "超级工厂",
    image: "/graphic/musk/08.jpg",
  },
  {
    id: "musk-09",
    page: 9,
    title: "星链",
    caption: "卫星网络把互联网铺向天空。",
    beat: "星链",
    image: "/graphic/musk/09.jpg",
  },
  {
    id: "musk-10",
    page: 10,
    title: "第一性原理",
    caption: "用第一性原理思考，而不是类比。",
    beat: "第一性原理",
    image: "/graphic/musk/10.jpg",
  }
  ],
};

export const welchNovel: GraphicNovel = {
  id: "welch",
  title: "赢（杰克·韦尔奇）",
  pages: [
  {
    id: "welch-01",
    page: 1,
    title: "封面",
    caption: "赢",
    beat: "封面",
    image: "/graphic/welch/01.jpg",
  },
  {
    id: "welch-02",
    page: 2,
    title: "坦诚",
    caption: "缺乏坦诚是商业生活中最卑劣的污点。",
    beat: "坦诚",
    image: "/graphic/welch/02.jpg",
  },
  {
    id: "welch-03",
    page: 3,
    title: "差异化",
    caption: "对人实行差异化管理，是构建伟大组织最重要的方法。",
    beat: "差异化",
    image: "/graphic/welch/03.jpg",
  },
  {
    id: "welch-04",
    page: 4,
    title: "愿景",
    caption: "好的领导者会提出简单、清晰、反复强调的愿景。",
    beat: "愿景",
    image: "/graphic/welch/04.jpg",
  },
  {
    id: "welch-05",
    page: 5,
    title: "变革",
    caption: "变革在你不得不进行之前就该开始。",
    beat: "变革",
    image: "/graphic/welch/05.jpg",
  },
  {
    id: "welch-06",
    page: 6,
    title: "用人",
    caption: "把合适的人放到合适的位置上。",
    beat: "用人",
    image: "/graphic/welch/06.jpg",
  },
  {
    id: "welch-07",
    page: 7,
    title: "竞争",
    caption: "如果你没有竞争优势，就不要竞争。",
    beat: "竞争",
    image: "/graphic/welch/07.jpg",
  },
  {
    id: "welch-08",
    page: 8,
    title: "危机",
    caption: "直面现实，即使现实令人不快。",
    beat: "危机",
    image: "/graphic/welch/08.jpg",
  },
  {
    id: "welch-09",
    page: 9,
    title: "团队",
    caption: "没有团队，你什么也不是。",
    beat: "团队",
    image: "/graphic/welch/09.jpg",
  },
  {
    id: "welch-10",
    page: 10,
    title: "赢的意义",
    caption: "有了《赢》，人们再也不需要阅读其他的商业管理著作了。",
    beat: "赢的意义",
    image: "/graphic/welch/10.jpg",
  }
  ],
};

export const luoNovel: GraphicNovel = {
  id: "luoyonghao",
  title: "我的奋斗（罗永浩）",
  pages: [
  {
    id: "luoyonghao-01",
    page: 1,
    title: "封面",
    caption: "《我的奋斗》是老罗写的一本极具语言才华的自传，也是他给剽悍的人生一个解释。",
    beat: "封面",
    image: "/graphic/luoyonghao/01.jpg",
  },
  {
    id: "luoyonghao-02",
    page: 2,
    title: "像坏人一样勤奋",
    caption: "后来我想到了生活的一个令人不安的真相：在这个世界上，坏人好像总是更勤奋一些。为了尝试改变一点什么，我最后把这本书写完了，就是这样。",
    beat: "像坏人一样勤奋",
    image: "/graphic/luoyonghao/02.jpg",
  },
  {
    id: "luoyonghao-03",
    page: 3,
    title: "思想特别复杂",
    caption: "他上幼儿园的时候，就被老师描述成一个「思想特别复杂的孩子」。",
    beat: "思想特别复杂",
    image: "/graphic/luoyonghao/03.jpg",
  },
  {
    id: "luoyonghao-04",
    page: 4,
    title: "校园生涯",
    caption: "和这个国家大多数有点想法的孩子一样，在我十来年的校园生涯里，几乎每一次尝试表达真情实感的时候，都会被那些教师们打击，通常的评语都是些「阴阳怪气」「思想复杂」「哗众取宠」。",
    beat: "校园生涯",
    image: "/graphic/luoyonghao/04.jpg",
  },
  {
    id: "luoyonghao-05",
    page: 5,
    title: "高中辍学",
    caption: "他在学校里跟愚蠢的制度对抗了九年，成为一个高中没毕业的小混混。",
    beat: "高中辍学",
    image: "/graphic/luoyonghao/05.jpg",
  },
  {
    id: "luoyonghao-06",
    page: 6,
    title: "摆摊与折腾",
    caption: "曾经摆地摊、开羊肉串店、倒卖药材、做期货、销售电脑配件、从事文学创作。",
    beat: "摆摊与折腾",
    image: "/graphic/luoyonghao/06.jpg",
  },
  {
    id: "luoyonghao-07",
    page: 7,
    title: "到北京",
    caption: "看到灰蒙蒙的天、拥挤不堪的马路、脏乎乎的道边都是灰尘黄土。",
    beat: "到北京",
    image: "/graphic/luoyonghao/07.jpg",
  },
  {
    id: "luoyonghao-08",
    page: 8,
    title: "新东方",
    caption: "2001年至2006年在北京新东方学校任教，由于教学风格幽默诙谐并且具有高度理想主义气质的感染力，所以极受学生欢迎。",
    beat: "新东方",
    image: "/graphic/luoyonghao/08.jpg",
  },
  {
    id: "luoyonghao-09",
    page: 9,
    title: "老罗语录·牛博网",
    caption: "很多学生盗录其讲课内容，以「老罗语录」的名义风靡大江南北。「彪悍的人生不需要解释」。2006年6月，罗永浩辞去新东方的工作，于同年8月创立牛博网。",
    beat: "老罗语录·牛博网",
    image: "/graphic/luoyonghao/09.jpg",
  },
  {
    id: "luoyonghao-10",
    page: 10,
    title: "收束",
    caption: "在这个世界上，坏人好像总是更勤奋一些。彪悍的人生不需要解释。",
    beat: "收束",
    image: "/graphic/luoyonghao/10.jpg",
  }
  ],
};

export const kaifuNovel: GraphicNovel = {
  id: "kaifu",
  title: "世界因你不同（李开复）",
  pages: [
  {
    id: "kaifu-01",
    page: 1,
    title: "封面",
    caption: "世界因你不同",
    beat: "封面",
    image: "/graphic/kaifu/01.jpg",
  },
  {
    id: "kaifu-02",
    page: 2,
    title: "小皇帝",
    caption: "捣蛋的「小皇帝」。",
    beat: "小皇帝",
    image: "/graphic/kaifu/02.jpg",
  },
  {
    id: "kaifu-03",
    page: 3,
    title: "十一岁留学生",
    caption: "十一岁的「留学生」。",
    beat: "十一岁留学生",
    image: "/graphic/kaifu/03.jpg",
  },
  {
    id: "kaifu-04",
    page: 4,
    title: "我的大学",
    caption: "大学里的选择决定了此后的道路。",
    beat: "我的大学",
    image: "/graphic/kaifu/04.jpg",
  },
  {
    id: "kaifu-05",
    page: 5,
    title: "博士与语音",
    caption: "让计算机听懂人的语言。",
    beat: "博士与语音",
    image: "/graphic/kaifu/05.jpg",
  },
  {
    id: "kaifu-06",
    page: 6,
    title: "二十六岁副教授",
    caption: "二十六岁的副教授。",
    beat: "二十六岁副教授",
    image: "/graphic/kaifu/06.jpg",
  },
  {
    id: "kaifu-07",
    page: 7,
    title: "苹果岁月",
    caption: "三十三岁的苹果副总裁。",
    beat: "苹果岁月",
    image: "/graphic/kaifu/07.jpg",
  },
  {
    id: "kaifu-08",
    page: 8,
    title: "微软亚洲研究院",
    caption: "在中国种下一座世界级的研究院。",
    beat: "微软亚洲研究院",
    image: "/graphic/kaifu/08.jpg",
  },
  {
    id: "kaifu-09",
    page: 9,
    title: "谷歌中国",
    caption: "谷歌中国的创始人。",
    beat: "谷歌中国",
    image: "/graphic/kaifu/09.jpg",
  },
  {
    id: "kaifu-10",
    page: 10,
    title: "世界因你不同",
    caption: "一个世界有你，一个世界没有你，让两者的不同最大，就是你一生的意义。",
    beat: "世界因你不同",
    image: "/graphic/kaifu/10.jpg",
  }
  ],
};

/**
 * 第一回《风雪惊变》开头 · 漫画小说 10 页
 * 严依小说正文顺序：钱塘听书 → 小酒店对谈 → 回家约猎。
 * 不抢跑：林中杀官、丘处机、灭门等后文不进本卷。
 */
export const guojingNovel: GraphicNovel = {
  id: "guojing",
  title: "射雕英雄传（郭靖）",
  pages: [
    {
      id: "guojing-01",
      page: 1,
      title: "封面",
      caption: "射雕英雄传",
      beat: "封面",
      image: "/graphic/guojing/01.jpg",
    },
    {
      id: "guojing-02",
      page: 2,
      title: "钱塘江边",
      caption:
        "钱塘江浩浩江水，日日夜夜从临安牛家村边绕过。正是八月，乌桕叶红，松下围着一堆村民。",
      beat: "钱塘江边",
      image: "/graphic/guojing/02.jpg",
    },
    {
      id: "guojing-03",
      page: 3,
      title: "说书",
      caption:
        "那说话人五十来岁，青布长袍洗得褪色。他敲起梨花木板，说的是金兵过后的惨祸。",
      beat: "说书",
      image: "/graphic/guojing/03.jpg",
    },
    {
      id: "guojing-04",
      page: 4,
      title: "请酒",
      caption:
        "村民中走出一个二十来岁的大汉，道：「小弟作东，请先生去饮上三杯。」他姓郭，名啸天；身旁是杨铁心。",
      beat: "请酒",
      image: "/graphic/guojing/04.jpg",
    },
    {
      id: "guojing-05",
      page: 5,
      title: "小酒店",
      caption:
        "小酒店主人是个跛子，慢慢烫了黄酒，摆出蚕豆花生，自行在门口望着落日，却不向三人望上一眼。",
      beat: "小酒店",
      image: "/graphic/guojing/05.jpg",
    },
    {
      id: "guojing-06",
      page: 6,
      title: "拍案",
      caption:
        "张十五道，金兵来与不来，拿主意的却不是金国，而是临安的大宋朝廷。郭啸天伸手在桌上重重一拍。",
      beat: "拍案",
      image: "/graphic/guojing/06.jpg",
    },
    {
      id: "guojing-07",
      page: 7,
      title: "骂秦桧",
      caption: "三人只是痛骂秦桧。那跛子忽然嘿嘿两声冷笑。",
      beat: "骂秦桧",
      image: "/graphic/guojing/07.jpg",
    },
    {
      id: "guojing-08",
      page: 8,
      title: "罪魁",
      caption:
        "曲三道：「想要杀岳爷爷议和的，罪魁祸首却不是秦桧。」说了这几句，一跷一拐又去坐在门边望天。",
      beat: "罪魁",
      image: "/graphic/guojing/08.jpg",
    },
    {
      id: "guojing-09",
      page: 9,
      title: "醉别",
      caption:
        "张十五喝得醺醺大醉，向东往临安而去。郭啸天付了酒钱，和杨铁心并肩回家。他两人比邻而居。",
      beat: "醉别",
      image: "/graphic/guojing/09.jpg",
    },
    {
      id: "guojing-10",
      page: 10,
      title: "李萍",
      caption:
        "郭啸天的浑家李氏正在赶鸡入笼，笑道请杨铁心来吃饭。当晚，两人约了去打野味。",
      beat: "李萍",
      image: "/graphic/guojing/10.jpg",
    },
  ],
};

export const novelsById: Record<string, GraphicNovel> = {
  jobs: jobsNovel,
  musk: muskNovel,
  welch: welchNovel,
  luoyonghao: luoNovel,
  kaifu: kaifuNovel,
  guojing: guojingNovel,
};

export const graphicCatalog: { id: string; title: string }[] = [
  { id: "jobs", title: jobsNovel.title },
  { id: "musk", title: muskNovel.title },
  { id: "welch", title: welchNovel.title },
  { id: "luoyonghao", title: luoNovel.title },
  { id: "kaifu", title: kaifuNovel.title },
  { id: "guojing", title: guojingNovel.title },
];

export function resolveNovelQuery(name: string): GraphicNovel | null {
  const raw = name.trim();
  const q = raw.toLowerCase();
  if (!q) return null;
  if (q.includes("乔布斯") || q.includes("jobs") || q.includes("steve")) return jobsNovel;
  if (q.includes("马斯克") || q.includes("musk") || q.includes("elon") || q.includes("特斯拉")) return muskNovel;
  if (q.includes("韦尔奇") || q.includes("welch") || q.includes("winning") || q === "赢" || q.includes("《赢》")) return welchNovel;
  if (q.includes("罗永浩") || q.includes("老罗") || q.includes("我的奋斗") || q.includes("yonghao")) return luoNovel;
  if (q.includes("李开复") || q.includes("开复") || q.includes("世界因你不同") || q.includes("kaifu")) return kaifuNovel;
  if (
    q.includes("郭靖") ||
    q.includes("guojing") ||
    q.includes("射雕") ||
    q.includes("射鵰") ||
    q.includes("condor")
  )
    return guojingNovel;
  const byTitle = graphicCatalog.find((c) => c.title === raw || c.title.toLowerCase() === q);
  if (byTitle) return novelsById[byTitle.id] ?? null;
  return null;
}
