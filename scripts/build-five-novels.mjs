/**
 * 五人各 50 页本地成片：
 * 乔布斯 / 马斯克 / 杰克·韦尔奇 / 罗永浩 / 李开复
 * - 不覆盖已有 .jpg
 * - 缺失页写水墨风 SVG
 * 运行: node scripts/build-five-novels.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const graphicRoot = path.join(root, "public", "graphic");

function pad(n) {
  return String(n).padStart(2, "0");
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLines(text, maxLen = 16, maxLines = 5) {
  const chars = [...String(text || "")];
  const lines = [];
  let cur = "";
  for (const ch of chars) {
    if (cur.length >= maxLen) {
      lines.push(cur);
      cur = "";
      if (lines.length >= maxLines) break;
    }
    cur += ch;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines.length ? lines : [""];
}

/** 多面板水墨页 */
function buildInkSvg({ page, title, caption, novelTitle, seed }) {
  const tLines = wrapLines(title, 11, 2);
  const cLines = wrapLines(caption, 15, 4);
  const s = (seed * 17 + page * 31) % 100;
  const ink = 40 + (s % 20);
  const panels = [
    `M${80 + (s % 20)} ${200 + (s % 30)} C${200} ${160}, ${320} ${280}, ${480} ${220}`,
    `M${120} ${520} C${260} ${460}, ${400} ${600}, ${640} ${540}`,
    `M${180} ${780} C${340} ${720}, ${500} ${860}, ${700} ${800}`,
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="864" height="1152" viewBox="0 0 864 1152">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%" stop-color="#f6f3eb"/>
      <stop offset="100%" stop-color="#ddd6c8"/>
    </linearGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.15  0 0 0 0 0.15  0 0 0 0 0.14  0 0 0 0.07 0"/></filter>
  </defs>
  <rect width="864" height="1152" fill="url(#bg)"/>
  <rect width="864" height="1152" filter="url(#grain)" opacity="0.55"/>
  <rect x="40" y="40" width="784" height="1072" fill="none" stroke="#4a463e" stroke-width="1.5" opacity="0.28"/>
  <!-- three loose panels -->
  <rect x="64" y="160" width="340" height="280" fill="none" stroke="#3a3731" stroke-width="1.2" opacity="0.22"/>
  <rect x="440" y="160" width="340" height="280" fill="none" stroke="#3a3731" stroke-width="1.2" opacity="0.22"/>
  <rect x="64" y="470" width="716" height="300" fill="none" stroke="#3a3731" stroke-width="1.2" opacity="0.22"/>
  ${panels
    .map(
      (d, i) =>
        `<path d="${d}" fill="none" stroke="#2f2c28" stroke-width="${2.2 - i * 0.3}" opacity="${0.18 + i * 0.04}"/>`,
    )
    .join("\n  ")}
  <circle cx="${280 + (s % 40)}" cy="${280}" r="${50 + (s % 25)}" fill="#5a564e" opacity="0.08"/>
  <circle cx="${580}" cy="${620}" r="${70}" fill="#4a4640" opacity="0.06"/>
  <text x="72" y="100" font-family="Songti SC, STSong, serif" font-size="15" fill="#7a756c">${escapeXml(novelTitle)} · ${page}/50</text>
  ${tLines
    .map(
      (ln, i) =>
        `<text x="72" y="${820 + i * 36}" font-family="Songti SC, STSong, serif" font-size="28" fill="#2a2824">${escapeXml(ln)}</text>`,
    )
    .join("\n  ")}
  ${cLines
    .map(
      (ln, i) =>
        `<text x="72" y="${920 + i * 28}" font-family="Songti SC, STSong, serif" font-size="18" fill="#4a4640">${escapeXml(ln)}</text>`,
    )
    .join("\n  ")}
  <text x="72" y="1105" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#9a958c" opacity="0.7">ink memoir · free</text>
</svg>`;
}

/** 通用：封面 + 48 个节拍骨架 + 收束 */
function makeBeats(id, title, coverCaption, moments) {
  // moments: string[] length ideally 48 (pages 2-49), we pad/truncate
  const m = [...moments];
  while (m.length < 48) m.push(`${title} · 余韵 ${m.length + 1}`);
  const beats = [
    {
      id: `${id}-01`,
      page: 1,
      title: "封面",
      caption: coverCaption,
      beat: "cover",
    },
  ];
  for (let i = 0; i < 48; i++) {
    const raw = m[i];
    const [t, ...rest] = raw.split("|");
    const caption = rest.join("|").trim() || t.trim();
    beats.push({
      id: `${id}-${pad(i + 2)}`,
      page: i + 2,
      title: t.trim().slice(0, 20),
      caption: caption.slice(0, 120),
      beat: t.trim().slice(0, 40),
    });
  }
  beats.push({
    id: `${id}-50`,
    page: 50,
    title: "合卷",
    caption: "五十页到此。故事还在纸外继续。",
    beat: "closing",
  });
  return beats;
}

// —— 马斯克 50（前 10 与现有成片对齐标题风格）——
const muskMoments = [
  "窗边的科幻|童年的房间不大，但书比墙厚。",
  "机房的夜|屏幕是唯一还亮着的湖。",
  "地图上的美国|创业早期，地图比办公桌大。",
  "厂房里的骨架|电动车先学会站着，再学会跑。",
  "海岸线的白烟|有些失败会炸开，有些失败教会站直。",
  "遥测的呼吸|控制室很少说话，数字替他们紧张。",
  "空掉的长桌|权力会换座位，野心很少换方向。",
  "屋顶上的星链|他把天空划成网格。",
  "未关闭的舱门|试读曾止于此，现在故事继续。",
  "非洲的阳光|比勒陀利亚的午后很长。",
  "连环画与代码|他把幻想焊进屏幕。",
  "跨洋的机票|行李很少，野心很多。",
  "Zip2 的走廊|走廊比办公室更像战场。",
  "支付的浪潮|钱在网上流动，像看不见的河。",
  "火星海报|办公室墙上贴着另一个星球。",
  "第一枚火箭|它会飞，也会摔。",
  "沙漠里的帐篷|发射场的风不听指挥。",
  "三次失败|第三次烟散尽时，还有人鼓掌。",
  "回收的腿|钢铁学会了回家。",
  "Gigafactory|厂房像一座沉默的城。",
  "产线的午夜|灯火通明，人不说废话。",
  "隧道与车|地下也想修一条近路。",
  "脑机的细线|科学像缝合，一针一线。",
  "卫星雨|夜空多了一些移动的星。",
  "推特的门口|钥匙换了手，噪声更大。",
  "直播裁员|屏幕前的沉默比掌声响。",
  "超级充电桩|公路变成一张电网。",
  "自动驾驶的雾|信任比算法难写。",
  "能源的屋顶|瓦片开始发电。",
  "电池的沉默|能量被关在冷静的盒子里。",
  "发射窗口|倒计时比心跳准。",
  "宇航员的门|门开的时候，世界屏住呼吸。",
  "股价的浪|数字上下，像潮汐戏弄沙。",
  "对手的影子|影子有时比人清晰。",
  "面试的白板|白板不说谎，人会。",
  "睡觉的工厂|有人在地板上合眼。",
  "监管的信|信比火箭重。",
  "公开信|玻璃一样透明，也割手。",
  "家庭的缝|公众看见火箭，家人看见门缝。",
  "火星时刻表|时间表写得很满，空白是奢侈。",
  "工程师文化|删除比添加更难。",
  "第一性原理|把问题拆到不能再拆。",
  "媒体的风暴|话筒比引擎吵。",
  "全球工厂|时区连成一条传送带。",
  "下一班飞船|故事不肯落幕。",
  "夜间的控制台|绿灯一排，像安静的星座。",
  "仍在加注|燃料与野心同时加注。",
  "地平线|路的尽头是另一条发射架。",
];

// —— 杰克·韦尔奇 ——
const welchMoments = [
  "马萨诸塞的少年|小城风硬，人学会先站直。",
  "化学与实验台|烧瓶比课本诚实。",
  "通用电气的门|门很大，影子更长。",
  "塑料事业部|塑料也能长成帝国的一角。",
  "年轻的经理|会议室第一次记住他的声音。",
  "中子杰克|有人说他冷酷，他说那是清理。",
  "数一数二|不做第一第二，就退出。",
  "层级的削减|公司变瘦，决策变快。",
  "六西格玛|质量被写成宗教。",
  "克罗顿维尔|课堂像另一条生产线。",
  "活力曲线|人被分进格子，格子会说话。",
  "股东的信|信写得很短，刀很快。",
  "收购的棋盘|收购像下棋，落子无悔。",
  "全球化|工厂跟着时区搬家。",
  "服务转型|卖机器的人开始卖承诺。",
  "金融臂膀|数字比钢铁轻，也更滑。",
  "媒体聚光灯|他喜欢镜头，镜头也喜欢他。",
  "直言不讳|句子短，回旋余地小。",
  "人才工厂|经理像被锻造的零件。",
  "边界的拆除|墙少了，风大了。",
  "电子商务|旧帝国学上网。",
  "竞争地图|地图上只留强者颜色。",
  "退休倒计时|交棒比登顶难。",
  "继任风波|三个人，一把椅子。",
  "离开的那天|大楼还在，名字开始淡。",
  "《赢》|他把方法写成畅销的刀法。",
  "演讲台|世界各地的听众记笔记。",
  "顾问岁月|退休不等于沉默。",
  "批评与神话|神话要靠批评养活。",
  "GE 的长影|公司的光还照在他身上。",
  "管理的语法|动词永远是：做、砍、建。",
  "文化战争|文化比战略难改。",
  "数字的信仰|仪表盘即神谕。",
  "领导者的孤独|顶层空气稀薄。",
  "风险偏好|他把风险当燃料。",
  "沟通的暴力|直接有时是礼物，有时是伤。",
  "全球经理人|护照比名片厚。",
  "工厂巡礼|他喜欢闻机油味。",
  "董事会|长桌放大声音与沉默。",
  "媒体访谈|话筒前，句子像子弹。",
  "遗产清单|有人写功，有人写过。",
  "二十世纪末|一个时代的CEO肖像。",
  "规则重写|他把规则写进习惯。",
  "速度|慢是唯一不可原谅的罪。",
  "简单|复杂被当成软弱。",
  "自信|自信有时是引擎，有时是盲点。",
  "回望GE|帝国会换脸，故事会留刺。",
  "最后的讲台|掌声落下，灯还亮着。",
];

// —— 罗永浩 ——
const luoMoments = [
  "东北的冬天|风大，人要把领子竖起来。",
  "英语老师|讲台是他最早的舞台。",
  "新东方的灯|灯火通明的教室像船舱。",
  "段子与语法|笑话里夹着认真。",
  "老罗语录|句子开始在网上飞。",
  "离开讲台|转身比站着难。",
  "锤子科技|他要做「重新发明」的东西。",
  "坚果发布会|PPT 很长，心更长。",
  "工业设计|他迷恋线条的干净。",
  "供应链的夜|理想撞上表格。",
  "吐槽与护短|爱恨都挂在嘴边。",
  "销量的压力|数字不听演讲。",
  "情怀的账单|情怀也会要利息。",
  "破产与道歉|麦克风前，声音变低。",
  "还债的路|一条很具体的路。",
  "直播间|灯光重新打在脸上。",
  "带货的手|手势比演讲简洁。",
  "粉丝不散|有人骂，有人等。",
  "午夜复盘|把失败拆成零件。",
  "再站起来|站姿还是略微前倾。",
  "产品经理梦|他始终想做出好用的东西。",
  "文案癖|一个词能改一晚上。",
  "朋友与合伙人|局里的人进进出出。",
  "媒体风暴|热搜像一阵阵风。",
  "厨房与烟火|生活比发布会碎。",
  "书架|书比奖杯多。",
  "自行车|有时骑出去就不想说话。",
  "舞台恐惧症|越怕越要站上去。",
  "用户来信|信比评论区暖。",
  "工厂参观|他喜欢摸材料。",
  "价格战|理想被砍价。",
  "团队加班|灯火是另一种掌声。",
  "公开的脆弱|示弱也需要勇气。",
  "二手与重生|旧物也能重新发光。",
  "时间表|日程写满，空白奢侈。",
  "东北口音|口音是故乡的章。",
  "中年|镜子比以前诚实。",
  "再创业|同一条河，不同的船。",
  "评论区|刀和花一起砸来。",
  "对谈|他把失败讲成故事。",
  "匠人执念|差一点就不甘心。",
  "账本|数字一行行清。",
  "清晨的工作室|咖啡比演讲提神。",
  "城市夜景|车灯像倒着的星。",
  "下一次亮相|幕布后还在调整领口。",
  "诚实|他最贵的产品或许是诚实。",
  "未完成清单|清单比完成的事长。",
  "继续说|只要还有下一段话。",
];

// —— 李开复 ——
const kaifuMoments = [
  "台湾与少年|成绩单以外，还有更大的地图。",
  "留学的箱子|箱子不重，问题很重。",
  "语音识别|让机器听懂人。",
  "卡内基梅隆|实验室的灯总是亮着。",
  "苹果岁月|个人计算正在长大。",
  "硅谷清晨|雾散得比会议慢。",
  "SGI|图形工作站的冷光。",
  "微软亚洲研究院|在北京种下一座实验室。",
  "研究员走廊|走廊里走过未来的名字。",
  "论文与原型|纸上的字变成可跑的程序。",
  "谷歌中国|搜索框像一扇新门。",
  "冲突与原则|有些门要自己关上。",
  "离开的声明|句子被全世界读。",
  "创新工场|投资变成另一种教书。",
  "年轻创业者|他听得比说得多。",
  "AI 浪潮|旧问题换了新名字。",
  "《人工智能》|他把判断写成书。",
  "癌症通报|生命忽然变得具体。",
  "康复的晨跑|步伐比以前慢，也更稳。",
  "时间观|时间从资产变成礼物。",
  "导师角色|问题比答案重要。",
  "中美之间|两套时钟同时走。",
  "公开演讲|话筒前谈未来与伦理。",
  "伦理清单|能做不等于该做。",
  "投资笔记|下注是一种投票。",
  "失败案例|失败被拿来上课。",
  "家庭餐桌|公众人物也要吃饭。",
  "写字台|键盘敲出另一种课。",
  "学生来信|信比新闻真实。",
  "实验室回访|气味还是熟悉的焊锡与咖啡。",
  "自动驾驶争论|方向盘该不该放手。",
  "大模型之年|参数膨胀，问题更锋利。",
  "就业焦虑|他把焦虑拆给年轻人听。",
  "终身学习|学位会过期，好奇不会。",
  "沟通的桥|两端都要有人走。",
  "媒体肖像|镜头喜欢简化人。",
  "深夜邮件|邮件时间戳像失眠记录。",
  "公益与教育|把机会分出去一点。",
  "旅行地图|机场是第二办公室。",
  "对谈科学家|争论里长出共识。",
  "年轻时的信|重读像见另一个自己。",
  "选择|每一次转身都留下回声。",
  "影响力|影响是责任的另一种叫法。",
  "中国AI生态|土壤比种子更重要。",
  "写作夜|把混乱写成清晰。",
  "下一堂课|课堂不在教室里。",
  "仍在提问|答案会旧，问题常新。",
  "地平线|路还长，步子更轻。",
];

// jobs: use existing beats from a compact re-export — we do NOT regenerate jobs images
// We'll only ensure musk 11-50, welch, luo, kaifu assets + write TS data file.

const novels = [
  {
    id: "jobs",
    title: "史蒂夫·乔布斯传",
    folder: "jobs",
    // beats filled from existing TS conceptually — build only ensures files; beats rewritten in output
    skipGenerateBeats: true,
  },
  {
    id: "musk",
    title: "埃隆·马斯克传",
    folder: "musk",
    cover: "Walter Isaacson — Elon Musk. 水墨纪实图像小说 · 五十页。",
    moments: muskMoments,
    seed: 2,
  },
  {
    id: "welch",
    title: "杰克·韦尔奇传",
    folder: "welch",
    cover: "Jack Welch · Winning. 通用电气与二十世纪末管理神话 · 五十页。",
    moments: welchMoments,
    seed: 3,
  },
  {
    id: "luoyonghao",
    title: "罗永浩传",
    folder: "luoyonghao",
    cover: "罗永浩 · 讲台、锤子与直播间 · 五十页水墨纪实。",
    moments: luoMoments,
    seed: 4,
  },
  {
    id: "kaifu",
    title: "李开复传",
    folder: "kaifu",
    cover: "李开复 · 研究、谷歌中国与人工智能 · 五十页。",
    moments: kaifuMoments,
    seed: 5,
  },
];

// Jobs 50 moments (aligned with existing local film narrative)
const jobsMoments = [
  "被选择的孩子|他先被放下，再被捡起。",
  "车库里的电流|电路板比课堂诚实。",
  "书法与空白|旁听书法课，后来屏幕记得空白。",
  "苹果从桌上滚落|他们给机器起了一个很甜的名字。",
  "一九八四|大屏幕裂开，人们鼓掌。",
  "离开自己的房子|他被请出自己盖的屋子。",
  "黑盒子与归来|NeXT 像一封写给未来的信。",
  "口袋里的宇宙|人群举起手机，像小小的月亮。",
  "边界|免费试读曾止于此，现在五十页敞开。",
  "修行的房间|印度静室里，找的是安静。",
  "苹果园里的命名|名字像咬过的果子。",
  "蓝盒子|少年时代的把戏变成产业。",
  "洛斯阿尔托斯|车库的门一关，世界变小。",
  "字节与美学|曲线放进机器。",
  "皮克斯的灯|另一家公司的灯光。",
  "思考不同|广告像宣言。",
  "半透明的颜色|iMac 像糖果。",
  "白色耳机线|城市里出现新的绳索。",
  "钥匙扣里的商店|App 长在口袋里。",
  "玻璃楼梯|苹果店像寺庙。",
  "病床与邮件|有些会议在医院走廊。",
  "斯坦福的草|生死讲成点与点的连接。",
  "产品像一句诗|删到不能再删。",
  "董事会的回声|长桌放大沉默。",
  "字体是性格|衬线与无衬线。",
  "日本的庭|石头的秩序与缝。",
  "工厂里的白|供应链没有硝烟。",
  "发布会的黑暗|灯一亮，他才出现。",
  "中途|若你仍在读，故事也仍在走。",
  "家人的门|公众看到产品，家人看到门缝。",
  "现实扭曲力场|画里只画空气的弯曲。",
  "音乐的白色|一千首歌进人口袋。",
  "动画的眼泪|玩具会说话之后。",
  "平板像窗户|指尖翻页。",
  "云|文件落在看不见的雨里。",
  "设计的厨房|挑剔材料的气味。",
  "竞争对手的影子|影子有时比人清晰。",
  "时间表|空白才是奢侈品。",
  "又一扇门|故事继续向后。",
  "最后的产品|有些发布会主角不在台上。",
  "信件|公开信像玻璃。",
  "继承者的椅子|温度慢慢散掉。",
  "校园与车库叠影|开头和结尾同一张底片。",
  "用户的手|无数只手划过玻璃。",
  "批评与掌声|两种声音抢话筒。",
  "极简的房间|东西越少，呼吸越大。",
  "传记的边|书有边界，故事溢出。",
  "余光|灯关掉后视网膜还亮着。",
];

function existingImage(folder, page) {
  const base = path.join(graphicRoot, folder, pad(page));
  for (const ext of ["jpg", "jpeg", "png", "webp", "svg"]) {
    if (fs.existsSync(`${base}.${ext}`)) return `${pad(page)}.${ext}`;
  }
  return null;
}

function ensurePages(novel, beats) {
  const dir = path.join(graphicRoot, novel.folder);
  fs.mkdirSync(dir, { recursive: true });
  let created = 0;
  let kept = 0;
  for (const b of beats) {
    const has = existingImage(novel.folder, b.page);
    if (has) {
      kept++;
      b._file = has;
      continue;
    }
    const file = `${pad(b.page)}.svg`;
    const svg = buildInkSvg({
      page: b.page,
      title: b.title,
      caption: b.caption,
      novelTitle: novel.title,
      seed: novel.seed || 1,
    });
    fs.writeFileSync(path.join(dir, file), svg, "utf8");
    b._file = file;
    created++;
  }
  return { created, kept };
}

function beatsToTs(beats, folder) {
  return beats
    .map((b) => {
      const file = b._file || `${pad(b.page)}.jpg`;
      return `  {
    id: ${JSON.stringify(b.id)},
    page: ${b.page},
    title: ${JSON.stringify(b.title)},
    caption: ${JSON.stringify(b.caption)},
    beat: ${JSON.stringify(b.beat)},
    image: ${JSON.stringify(`/graphic/${folder}/${file}`)},
  }`;
    })
    .join(",\n");
}

// Build all
const built = {};

// jobs
const jobsBeats = makeBeats(
  "jobs",
  "史蒂夫·乔布斯传",
  "Walter Isaacson — Steve Jobs. 水墨纪实图像小说 · 五十页。",
  jobsMoments,
);
// prefer existing files
{
  const novel = { id: "jobs", title: "史蒂夫·乔布斯传", folder: "jobs", seed: 1 };
  const stats = ensurePages(novel, jobsBeats);
  console.log(`[jobs] kept=${stats.kept} created=${stats.created}`);
  built.jobs = { novel, beats: jobsBeats };
}

for (const n of novels.filter((x) => x.id !== "jobs")) {
  const beats = makeBeats(n.id, n.title, n.cover, n.moments);
  const stats = ensurePages(n, beats);
  console.log(`[${n.id}] kept=${stats.kept} created=${stats.created}`);
  built[n.id] = { novel: n, beats };
}

// Write TypeScript data
const ts = `/**
 * 五人图像小说 · 各 50 页 · 全免费
 * 由 scripts/build-five-novels.mjs 生成资源；本文件手写/同步结构。
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

export const jobsNovel: GraphicNovel = {
  id: "jobs",
  title: "史蒂夫·乔布斯传",
  pages: [
${beatsToTs(built.jobs.beats, "jobs")}
  ],
};

export const muskNovel: GraphicNovel = {
  id: "musk",
  title: "埃隆·马斯克传",
  pages: [
${beatsToTs(built.musk.beats, "musk")}
  ],
};

export const welchNovel: GraphicNovel = {
  id: "welch",
  title: "杰克·韦尔奇传",
  pages: [
${beatsToTs(built.welch.beats, "welch")}
  ],
};

export const luoNovel: GraphicNovel = {
  id: "luoyonghao",
  title: "罗永浩传",
  pages: [
${beatsToTs(built.luoyonghao.beats, "luoyonghao")}
  ],
};

export const kaifuNovel: GraphicNovel = {
  id: "kaifu",
  title: "李开复传",
  pages: [
${beatsToTs(built.kaifu.beats, "kaifu")}
  ],
};

export const novelsById: Record<string, GraphicNovel> = {
  jobs: jobsNovel,
  musk: muskNovel,
  welch: welchNovel,
  luoyonghao: luoNovel,
  kaifu: kaifuNovel,
};

export const graphicCatalog: { id: string; title: string }[] = [
  { id: "jobs", title: jobsNovel.title },
  { id: "musk", title: muskNovel.title },
  { id: "welch", title: welchNovel.title },
  { id: "luoyonghao", title: luoNovel.title },
  { id: "kaifu", title: kaifuNovel.title },
];

export function resolveNovelQuery(name: string): GraphicNovel | null {
  const raw = name.trim();
  const q = raw.toLowerCase();
  if (!q) return null;

  if (
    q.includes("乔布斯") ||
    q.includes("jobs") ||
    q.includes("steve") ||
    (q.includes("苹果") && (q.includes("传") || q.includes("jobs")))
  ) {
    return jobsNovel;
  }
  if (
    q.includes("马斯克") ||
    q.includes("musk") ||
    q.includes("elon") ||
    q.includes("特斯拉") ||
    q.includes("星链")
  ) {
    return muskNovel;
  }
  if (
    q.includes("韦尔奇") ||
    q.includes("welch") ||
    q.includes("通用电气") ||
    q.includes("ge ") ||
    q === "ge"
  ) {
    return welchNovel;
  }
  if (
    q.includes("罗永浩") ||
    q.includes("老罗") ||
    q.includes("锤子") ||
    q.includes("坚果") ||
    q.includes("yonghao")
  ) {
    return luoNovel;
  }
  if (
    q.includes("李开复") ||
    q.includes("开复") ||
    q.includes("kaifu") ||
    q.includes("kai-fu") ||
    q.includes("创新工场")
  ) {
    return kaifuNovel;
  }

  const byTitle = graphicCatalog.find(
    (c) => c.title === raw || c.title.toLowerCase() === q,
  );
  if (byTitle) return novelsById[byTitle.id] ?? null;

  return null;
}
`;

const outTs = path.join(root, "src/data/graphic-novels.ts");
fs.writeFileSync(outTs, ts, "utf8");
console.log("wrote", outTs);

// README
fs.writeFileSync(
  path.join(graphicRoot, "README.md"),
  `# graphic assets · 五人 × 50 页 · 全免费

| 目录 | 人物 |
|------|------|
| jobs/ | 史蒂夫·乔布斯 |
| musk/ | 埃隆·马斯克 |
| welch/ | 杰克·韦尔奇 |
| luoyonghao/ | 罗永浩 |
| kaifu/ | 李开复 |

已有 \`.jpg\` 保留；缺失页由 \`scripts/build-five-novels.mjs\` 生成水墨 SVG。
`,
  "utf8",
);

console.log("done.");
