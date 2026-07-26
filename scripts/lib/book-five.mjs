/**
 * 真实书目 → 5 页图像小说
 * - 第 1 页：实体书封面（Open Library / 维基等公开源）
 * - 第 2–5 页：严格按该书公开情节骨架的水墨节拍
 * - 出图：有 XAI_API_KEY 用 Imagine；否则水墨 SVG（caption 为真实情节）
 */
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { STYLE_CORE, makeJobId } from "./graphic-generate.mjs";

const XAI_BASE = (process.env.XAI_API_BASE || "https://api.x.ai/v1").replace(
  /\/$/,
  "",
);
const CHAT_MODEL = process.env.XAI_CHAT_MODEL || "grok-4-1-fast-non-reasoning";
const IMAGE_MODEL = process.env.XAI_IMAGE_MODEL || "grok-imagine-image";
const PAGES = 5;

/** 已知真实书目：人物/别名 → 书 */
const KNOWN_BOOKS = [
  {
    id: "shediao",
    title: "射雕英雄传",
    author: "金庸",
    type: "novel",
    match: ["射雕", "郭靖", "黄蓉", "金庸射雕", "射雕英雄"],
    openLibraryQ: "Legend of the Condor Heroes Jin Yong",
    coverHints: ["射雕英雄传", "Condor Heroes"],
    beats: [
      {
        page: 1,
        title: "封面",
        caption: "金庸《射雕英雄传》。以下五页按原著开篇情节改写为图像小说。",
        beat: "original published book cover",
        imagePrompt:
          "published Chinese wuxia novel book cover layout soft paper, not a person portrait, recognizable classic novel cover aesthetic",
      },
      {
        page: 2,
        title: "牛家村",
        caption:
          "南宋末年，郭啸天、杨铁心两家遭追杀。遗腹子郭靖后来在蒙古大漠长大。",
        beat: "牛家村惨变",
        imagePrompt:
          "Southern Song village night fire and escape, soft ink wash multi-panel comic, silhouettes, no logos",
      },
      {
        page: 3,
        title: "江南七怪",
        caption:
          "江南七怪在大漠找到郭靖，收他为徒，约定十八年后再与全真教比试徒弟。",
        beat: "收徒",
        imagePrompt:
          "desert camp seven eccentric martial teachers and a boy, ink wash sequential comic page",
      },
      {
        page: 4,
        title: "大漠少年",
        caption:
          "郭靖愚钝却执着。他在蒙古学射、学义，也结下与华筝的童年情谊。",
        beat: "大漠",
        imagePrompt:
          "Mongolian steppe boy with bow and horse, quiet documentary ink wash panels",
      },
      {
        page: 5,
        title: "初入中原",
        caption:
          "十八年后郭靖南下。江湖将起，黄蓉、洪七公与《九阴真经》的线索渐次展开。",
        beat: "南下",
        imagePrompt:
          "young traveler entering Chinese river town, ink wash graphic novel page, first journey south",
      },
    ],
  },
  {
    id: "xiyouji",
    title: "西游记",
    author: "吴承恩",
    type: "novel",
    match: ["西游记", "西游", "孙悟空", "唐僧", "猪八戒", "沙僧", "取经"],
    openLibraryQ: "Journey to the West Wu Cheng'en",
    coverHints: ["西游记", "Journey to the West"],
    beats: [
      {
        page: 1,
        title: "封面",
        caption: "吴承恩《西游记》。以下五页按原著开篇情节改写为图像小说。",
        beat: "cover",
        imagePrompt:
          "classic Chinese myth novel book cover Journey to the West aesthetic, paper and ink, not photoreal",
      },
      {
        page: 2,
        title: "石猴出世",
        caption:
          "东胜神洲花果山，仙石迸裂，石猴出世。他拜师求道，学得七十二变与筋斗云。",
        beat: "石猴",
        imagePrompt:
          "stone monkey born from mountain rock, misty Chinese landscape, ink wash comic multi-panel",
      },
      {
        page: 3,
        title: "美猴王",
        caption:
          "石猴被众猴拥为美猴王，占花果山，却仍不安于寿命有限，远涉海外求长生。",
        beat: "美猴王",
        imagePrompt:
          "monkey king among monkeys on flower fruit mountain, soft gray watercolor comic",
      },
      {
        page: 4,
        title: "大闹天宫",
        caption:
          "他搅乱蟠桃会，自封齐天大圣，与天兵交战，最终被压五行山下。",
        beat: "大闹天宫",
        imagePrompt:
          "heavenly palace chaos ink wash sequential art, monkey silhouette vs clouds, not gaudy",
      },
      {
        page: 5,
        title: "西行起程",
        caption:
          "五百年后唐僧取经路过，揭帖收徒。孙悟空戴上紧箍，踏上西行。",
        beat: "取经",
        imagePrompt:
          "monk and monkey disciple on dusty road west, quiet ink wash graphic memoir page",
      },
    ],
  },
  {
    id: "matsushita",
    title: "松下幸之助传",
    author: "公开传记叙事",
    type: "biography",
    match: ["松下幸之助", "松下", "幸之助", "matsushita", "panasonic founder"],
    openLibraryQ: "Konosuke Matsushita biography",
    coverHints: ["Matsushita", "松下幸之助"],
    beats: [
      {
        page: 1,
        title: "封面",
        caption:
          "松下幸之助相关公开传记。以下五页取其公开生平骨架，非某一版原文照抄。",
        beat: "cover",
        imagePrompt:
          "Japanese business biography book cover design, restrained paper texture, not celebrity photo",
      },
      {
        page: 2,
        title: "早年",
        caption:
          "出身和歌山农商之家，少年时期经历家道中落，很早进入大阪谋生。",
        beat: "youth",
        imagePrompt:
          "early 20th century Osaka alley apprentice boy silhouette, ink wash comic page",
      },
      {
        page: 3,
        title: "创业",
        caption:
          "他从插座与自行车灯等小产品做起，把「让好物走入寻常人家」当作经营信条。",
        beat: "startup",
        imagePrompt:
          "small workshop light sockets and bicycle lamp on wooden table, documentary ink wash",
      },
      {
        page: 4,
        title: "经营之道",
        caption:
          "战后重建中，松下强调水坝式经营与人才培养，企业逐渐长成国民品牌。",
        beat: "management",
        imagePrompt:
          "postwar Japanese factory floor soft gray sequential panels, quiet workers silhouettes",
      },
      {
        page: 5,
        title: "PHP 与余响",
        caption:
          "他创办 PHP 研究所，把经营经验写成对大众的说话。故事仍在产业史中回响。",
        beat: "php",
        imagePrompt:
          "study desk books and lamp Japan mid century, contemplative ink wash last free pages",
      },
    ],
  },
  {
    id: "hongloumeng",
    title: "红楼梦",
    author: "曹雪芹",
    type: "novel",
    match: ["红楼梦", "石头记", "贾宝玉", "林黛玉", "薛宝钗"],
    openLibraryQ: "Dream of the Red Chamber Cao Xueqin",
    coverHints: ["红楼梦", "Red Chamber"],
    beats: [
      {
        page: 1,
        title: "封面",
        caption: "曹雪芹《红楼梦》。以下五页按原著开篇情节改写为图像小说。",
        beat: "cover",
        imagePrompt: "classic Dream of the Red Chamber book cover aesthetic paper",
      },
      {
        page: 2,
        title: "顽石与通灵",
        caption: "女娲补天余石通灵，幻形入世。故事从神话折入红楼。",
        beat: "stone",
        imagePrompt: "mythic stone and mist Chinese ink wash multi-panel comic",
      },
      {
        page: 3,
        title: "甄士隐",
        caption: "姑苏乡宦甄士隐梦入太虚，旋即家遭变故，铺垫「好了」之叹。",
        beat: "zhen",
        imagePrompt: "Jiangnan courtyard dream and fire aftermath soft ink wash",
      },
      {
        page: 4,
        title: "贾雨村",
        caption: "穷儒贾雨村发迹，冷子兴演说荣国府，贾府轮廓初现。",
        beat: "jia yucun",
        imagePrompt: "scholar inn conversation Qing dynasty ink wash sequential",
      },
      {
        page: 5,
        title: "林黛玉进贾府",
        caption: "林黛玉别父进京，步步留心，荣国府的繁华与规矩一页展开。",
        beat: "daiyu enters",
        imagePrompt:
          "young girl entering grand Chinese mansion quiet observation ink wash comic",
      },
    ],
  },
  {
    id: "sanguo",
    title: "三国演义",
    author: "罗贯中",
    type: "novel",
    match: ["三国演义", "三国", "刘备", "关羽", "张飞", "曹操", "诸葛亮"],
    openLibraryQ: "Romance of the Three Kingdoms Luo Guanzhong",
    coverHints: ["三国演义", "Three Kingdoms"],
    beats: [
      {
        page: 1,
        title: "封面",
        caption: "罗贯中《三国演义》。以下五页按原著开篇情节改写为图像小说。",
        beat: "cover",
        imagePrompt: "Romance of the Three Kingdoms classic book cover aesthetic",
      },
      {
        page: 2,
        title: "桃园结义",
        caption: "黄巾乱起，刘备、关羽、张飞桃园结义，誓共生死。",
        beat: "peach garden",
        imagePrompt: "three men oath under peach trees ink wash multi-panel",
      },
      {
        page: 3,
        title: "破黄巾",
        caption: "三人随官军破黄巾，初露锋芒，也看清乱世官场。",
        beat: "yellow turban",
        imagePrompt: "ancient battle dust banners soft gray ink wash comic",
      },
      {
        page: 4,
        title: "董卓乱政",
        caption: "董卓入京专权，曹操献刀未成，天下英雄暗生异志。",
        beat: "dong zhuo",
        imagePrompt: "palace night dagger intrigue ink wash sequential panels",
      },
      {
        page: 5,
        title: "三英战吕布",
        caption: "虎牢关前，刘关张战吕布，温酒斩将的时代即将到来。",
        beat: "lu bu",
        imagePrompt: "three warriors vs one on gate bridge ink wash comic page",
      },
    ],
  },
];

function hasXaiKey() {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

export function makeBookJobId() {
  return makeJobId();
}

/**
 * 解析用户输入 → 真实书目 + 5 节拍
 */
export function resolveBookQuery(raw) {
  const q = String(raw || "").trim();
  if (!q) return null;
  const lower = q.toLowerCase();

  for (const book of KNOWN_BOOKS) {
    if (book.match.some((m) => q.includes(m) || lower.includes(m.toLowerCase()))) {
      return {
        ...book,
        query: q,
        resolvedTitle: book.title,
      };
    }
  }

  // 未命中词典：仍当作真实书名尝试（封面靠 Open Library，节拍用通用开篇骨架）
  return {
    id: "custom",
    title: q.replace(/《|》/g, "").slice(0, 40),
    author: "待核",
    type: "unknown",
    match: [],
    openLibraryQ: q,
    coverHints: [q],
    query: q,
    resolvedTitle: q.replace(/《|》/g, "").slice(0, 40),
    beats: buildGenericBeats(q.replace(/《|》/g, "").slice(0, 40)),
  };
}

function buildGenericBeats(title) {
  return [
    {
      page: 1,
      title: "封面",
      caption: `《${title}》。第 1 页为公开可检索的实体书封面；其后四页按该书常见开篇叙事骨架改写。`,
      beat: "cover",
      imagePrompt: `published book cover for "${title}", paper texture, realistic cover photo style allowed for cover only`,
    },
    {
      page: 2,
      title: "开篇",
      caption: `《${title}》开篇：人物与世界的第一次露面。`,
      beat: "opening",
      imagePrompt: `opening chapter scene of well-known book "${title}", ink wash graphic novel multi-panel, artistic not photoreal celebrity`,
    },
    {
      page: 3,
      title: "冲突",
      caption: `情节第一次收紧：愿望遇到阻力。`,
      beat: "conflict",
      imagePrompt: `early conflict scene from "${title}", soft gray ink wash sequential comic`,
    },
    {
      page: 4,
      title: "转折",
      caption: `一个选择改变路线，故事进入正轨。`,
      beat: "turn",
      imagePrompt: `turning point early in "${title}", documentary ink wash comic page`,
    },
    {
      page: 5,
      title: "前五页止",
      caption: `试读五页到此。完整情节请回到原书。`,
      beat: "end free",
      imagePrompt: `open book on desk dawn, contemplative ink wash last preview page of "${title}"`,
    },
  ];
}

async function fetchOpenLibraryCover(book) {
  const q = encodeURIComponent(book.openLibraryQ || book.title);
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${q}&limit=5`,
      { headers: { "User-Agent": "feixue-workshop-graphic/1.0" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const docs = data?.docs || [];
    for (const d of docs) {
      if (d.cover_i) {
        return `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`;
      }
      if (d.cover_edition_key) {
        return `https://covers.openlibrary.org/b/olid/${d.cover_edition_key}-L.jpg`;
      }
    }
  } catch (e) {
    console.warn("[book-five] openlibrary", e.message);
  }
  return null;
}

async function downloadToFile(url, filePath) {
  const res = await fetch(url, {
    headers: { "User-Agent": "feixue-workshop-graphic/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`下载封面失败 ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 800) throw new Error("封面过小，可能无效");
  fs.writeFileSync(filePath, buf);
  return buf;
}

async function xaiChat(messages) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("无密钥");
  const res = await fetch(`${XAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature: 0.4,
      stream: false,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `chat ${res.status}`);
  return String(data?.choices?.[0]?.message?.content || "");
}

async function xaiImage(prompt) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("无密钥");
  const full = `${prompt}. Style: ${STYLE_CORE}. Vertical comic page 3:4.`;
  const res = await fetch(`${XAI_BASE}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt: full,
      n: 1,
      aspect_ratio: "3:4",
      response_format: "b64_json",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `img ${res.status}`);
  const b64 = data?.data?.[0]?.b64_json;
  if (b64) return Buffer.from(b64, "base64");
  const url = data?.data?.[0]?.url;
  if (url) {
    const r = await fetch(url);
    return Buffer.from(await r.arrayBuffer());
  }
  throw new Error("无图数据");
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

function buildInkSvg({ page, title, caption, novelTitle }) {
  const tLines = wrapLines(title, 12, 2);
  const cLines = wrapLines(caption, 16, 5);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="864" height="1152" viewBox="0 0 864 1152">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%" stop-color="#f6f3eb"/><stop offset="100%" stop-color="#ddd6c8"/>
    </linearGradient>
  </defs>
  <rect width="864" height="1152" fill="url(#bg)"/>
  <rect x="48" y="48" width="768" height="1056" fill="none" stroke="#4a463e" stroke-width="1.5" opacity="0.3"/>
  <rect x="72" y="160" width="320" height="260" fill="none" stroke="#3a3731" opacity="0.2"/>
  <rect x="430" y="160" width="320" height="260" fill="none" stroke="#3a3731" opacity="0.2"/>
  <rect x="72" y="450" width="678" height="280" fill="none" stroke="#3a3731" opacity="0.2"/>
  <path d="M140 280 C280 200 400 340 560 260" fill="none" stroke="#2f2c28" stroke-width="2" opacity="0.2"/>
  <text x="72" y="100" font-family="Songti SC, STSong, serif" font-size="16" fill="#7a756c">${escapeXml(novelTitle)} · ${page}/5</text>
  ${tLines.map((ln, i) => `<text x="72" y="${780 + i * 36}" font-family="Songti SC, STSong, serif" font-size="30" fill="#2a2824">${escapeXml(ln)}</text>`).join("\n")}
  ${cLines.map((ln, i) => `<text x="72" y="${880 + i * 28}" font-family="Songti SC, STSong, serif" font-size="18" fill="#4a4640">${escapeXml(ln)}</text>`).join("\n")}
</svg>`;
}

async function refineBeatsWithLlm(book) {
  if (!hasXaiKey() || book.id !== "custom") return book.beats;
  try {
    const content = await xaiChat([
      {
        role: "system",
        content: `You map a real published book to exactly 5 graphic-novel pages.
Page 1 is cover. Pages 2-5 must follow the ACTUAL well-known opening of the real book (public knowledge only).
Return ONLY JSON array: [{page,title,caption,imagePrompt}] with Chinese title/caption, English imagePrompt.
No invention of private facts. No photoreal celebrity portraits.`,
      },
      {
        role: "user",
        content: `User query: ${book.query}\nResolved title: ${book.resolvedTitle}`,
      },
    ]);
    const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const arr = JSON.parse(cleaned.match(/\[[\s\S]*\]/)?.[0] || cleaned);
    if (!Array.isArray(arr) || arr.length < 5) return book.beats;
    return arr.slice(0, 5).map((b, i) => ({
      page: i + 1,
      title: String(b.title || `第 ${i + 1} 页`).slice(0, 40),
      caption: String(b.caption || "").slice(0, 160),
      beat: String(b.beat || b.title || "").slice(0, 80),
      imagePrompt: String(b.imagePrompt || b.title || book.title).slice(0, 400),
    }));
  } catch (e) {
    console.warn("[book-five] llm refine failed", e.message);
    return book.beats;
  }
}

/**
 * @param {{ root: string, jobId: string, query: string, onProgress?: Function }} opts
 */
function loadBookCache(root, bookId) {
  if (!bookId || bookId === "custom") return null;
  const dir = path.join(root, "public", "graphic", "books", bookId);
  if (!fs.existsSync(dir)) return null;
  const pages = [];
  for (let i = 1; i <= PAGES; i++) {
    const base = String(i).padStart(2, "0");
    let file = null;
    for (const ext of ["jpg", "jpeg", "png", "webp", "svg"]) {
      const p = path.join(dir, `${base}.${ext}`);
      if (fs.existsSync(p)) {
        file = `${base}.${ext}`;
        break;
      }
    }
    if (!file) return null;
    pages.push(file);
  }
  return { dir, pages };
}

export async function generateBookFivePages({
  root,
  jobId,
  query,
  onProgress = () => {},
}) {
  const book = resolveBookQuery(query);
  if (!book) throw new Error("请输入书名或人物名");

  const outDir = path.join(root, "public", "graphic", "generated", jobId);
  fs.mkdirSync(outDir, { recursive: true });

  onProgress({
    status: "running",
    progress: 8,
    message: `解析书目：${book.resolvedTitle}`,
    mode: hasXaiKey() ? "xai" : "offline",
  });

  let beats = book.beats;
  // 本地真图缓存（books/{id}/01-05）优先：秒开、封面与内容页均为成片
  const cache = loadBookCache(root, book.id);
  if (cache) {
    onProgress({
      status: "running",
      progress: 40,
      message: "命中本地成片缓存…",
      mode: "cache",
    });
    const pages = beats.slice(0, PAGES).map((beat, i) => {
      const file = cache.pages[i];
      // 复制到 generated/{jobId} 以便统一路径
      const dest = path.join(outDir, file);
      fs.copyFileSync(path.join(cache.dir, file), dest);
      return {
        id: `${jobId}-${String(i + 1).padStart(2, "0")}`,
        page: i + 1,
        title: beat.title,
        caption: beat.caption,
        beat: beat.beat,
        image: `/graphic/generated/${jobId}/${file}`,
      };
    });
    const novel = {
      id: jobId,
      title: book.resolvedTitle,
      pages,
      freePages: PAGES,
      totalPlanned: PAGES,
      generated: true,
      bookMeta: {
        author: book.author,
        type: book.type,
        query: book.query,
        source: "cache",
      },
      createdAt: new Date().toISOString(),
      mode: "cache",
    };
    fs.writeFileSync(
      path.join(outDir, "manifest.json"),
      JSON.stringify(novel, null, 2) + "\n",
    );
    onProgress({
      status: "done",
      progress: 100,
      message: "五页成片就绪",
      novel,
    });
    return novel;
  }

  beats = await refineBeatsWithLlm(book);
  if (!beats?.length) beats = book.beats;

  // 封面
  onProgress({
    status: "running",
    progress: 15,
    message: "正在获取实体书封面…",
  });

  const pages = [];
  let coverOk = false;
  const coverPathJpg = path.join(outDir, "01.jpg");
  try {
    const coverUrl = await fetchOpenLibraryCover(book);
    if (coverUrl) {
      await downloadToFile(coverUrl, coverPathJpg);
      coverOk = true;
    }
  } catch (e) {
    console.warn("[book-five] cover", e.message);
  }

  if (!coverOk) {
    // 封面也走出图 / SVG
    try {
      if (hasXaiKey()) {
        const buf = await xaiImage(
          beats[0].imagePrompt ||
            `authentic published book cover for ${book.resolvedTitle} by ${book.author}`,
        );
        fs.writeFileSync(coverPathJpg, buf);
        coverOk = true;
      }
    } catch (e) {
      console.warn("[book-five] cover gen", e.message);
    }
  }

  if (coverOk) {
    pages.push({
      id: `${jobId}-01`,
      page: 1,
      title: beats[0]?.title || "封面",
      caption: beats[0]?.caption || `《${book.resolvedTitle}》`,
      beat: "cover",
      image: `/graphic/generated/${jobId}/01.jpg`,
    });
  } else {
    const svg = buildInkSvg({
      page: 1,
      title: beats[0]?.title || "封面",
      caption: beats[0]?.caption || book.resolvedTitle,
      novelTitle: book.resolvedTitle,
    });
    fs.writeFileSync(path.join(outDir, "01.svg"), svg, "utf8");
    pages.push({
      id: `${jobId}-01`,
      page: 1,
      title: beats[0]?.title || "封面",
      caption: beats[0]?.caption || `《${book.resolvedTitle}》`,
      beat: "cover",
      image: `/graphic/generated/${jobId}/01.svg`,
    });
  }

  // 2–5 页
  for (let i = 1; i < PAGES; i++) {
    const beat = beats[i] || beats[beats.length - 1];
    const page = i + 1;
    const base = String(page).padStart(2, "0");
    onProgress({
      status: "running",
      progress: 20 + i * 18,
      message: `生成第 ${page} 页：${beat.title}`,
    });

    let imagePath;
    if (hasXaiKey()) {
      try {
        const buf = await xaiImage(beat.imagePrompt);
        fs.writeFileSync(path.join(outDir, `${base}.jpg`), buf);
        imagePath = `/graphic/generated/${jobId}/${base}.jpg`;
      } catch (e) {
        console.warn(`[book-five] p${page}`, e.message);
      }
    }
    if (!imagePath) {
      const svg = buildInkSvg({
        page,
        title: beat.title,
        caption: beat.caption,
        novelTitle: book.resolvedTitle,
      });
      fs.writeFileSync(path.join(outDir, `${base}.svg`), svg, "utf8");
      imagePath = `/graphic/generated/${jobId}/${base}.svg`;
    }

    pages.push({
      id: `${jobId}-${base}`,
      page,
      title: beat.title,
      caption: beat.caption,
      beat: beat.beat,
      image: imagePath,
    });
  }

  const novel = {
    id: jobId,
    title: book.resolvedTitle,
    pages,
    freePages: PAGES,
    totalPlanned: PAGES,
    generated: true,
    bookMeta: {
      author: book.author,
      type: book.type,
      query: book.query,
      source: book.id === "custom" ? "open-resolve" : "catalog",
    },
    createdAt: new Date().toISOString(),
    mode: hasXaiKey() ? "xai" : "offline",
  };

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(novel, null, 2) + "\n",
  );

  onProgress({
    status: "done",
    progress: 100,
    message: "五页生成完成",
    novel,
  });

  return novel;
}

export { PAGES as BOOK_FIVE_PAGES, KNOWN_BOOKS };
