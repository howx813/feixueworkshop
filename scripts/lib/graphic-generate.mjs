/**
 * 任意自传/日记 → 10 页水墨纪实图像小说
 * - 有 XAI_API_KEY：chat 拆节拍 + grok-imagine 出图
 * - 无密钥：本地节拍 + SVG 水墨占位页（可演示全流程）
 */
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export const STYLE_CORE = [
  "documentary graphic memoir comic page",
  "Emmanuel Guibert style Chinese ink wash and soft gray watercolor",
  "loose imperfect natural lines, not clean commercial manga",
  "muted desaturated palette, quiet observational storytelling",
  "European nonfiction graphic novel restraint",
  "artistic interpretation soft ink figures, not photorealistic celebrity portrait",
  "no readable text logos or watermarks in the image",
  "no military WWII comic references unless source is about that",
].join(", ");

const CHAT_MODEL = process.env.XAI_CHAT_MODEL || "grok-4-1-fast-non-reasoning";
const IMAGE_MODEL = process.env.XAI_IMAGE_MODEL || "grok-imagine-image";
const XAI_BASE = (process.env.XAI_API_BASE || "https://api.x.ai/v1").replace(/\/$/, "");
const FREE_PAGES = 10;

export function makeJobId() {
  const t = Date.now().toString(36).toUpperCase();
  const r = randomBytes(3).toString("hex").toUpperCase();
  return `GN${t}${r}`;
}

function hasXaiKey() {
  return Boolean(process.env.XAI_API_KEY && process.env.XAI_API_KEY.trim());
}

async function xaiChat(messages, { temperature = 0.7 } = {}) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("缺少 XAI_API_KEY");
  const res = await fetch(`${XAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature,
      stream: false,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.error?.message || data?.message || `chat 失败 HTTP ${res.status}`,
    );
  }
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("chat 返回为空");
  return String(content);
}

async function xaiImage(prompt) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("缺少 XAI_API_KEY");
  const full = `${prompt}. Style: ${STYLE_CORE}. Vertical comic page composition 3:4.`;
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
  if (!res.ok) {
    throw new Error(
      data?.error?.message || data?.message || `出图失败 HTTP ${res.status}`,
    );
  }
  const b64 = data?.data?.[0]?.b64_json;
  if (b64) return Buffer.from(b64, "base64");
  const url = data?.data?.[0]?.url;
  if (url) {
    const imgRes = await fetch(url);
    if (!imgRes.ok) throw new Error(`下载图片失败 HTTP ${imgRes.status}`);
    return Buffer.from(await imgRes.arrayBuffer());
  }
  throw new Error("出图返回无数据");
}

function extractJson(text) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (m) return JSON.parse(m[0]);
    throw new Error("无法解析节拍 JSON");
  }
}

function normalizeBeats(raw, title) {
  const list = Array.isArray(raw) ? raw : raw?.pages || raw?.beats || [];
  if (!Array.isArray(list) || list.length < 1) {
    throw new Error("节拍列表为空");
  }
  const out = [];
  for (let i = 0; i < FREE_PAGES; i++) {
    const src = list[i] || list[list.length - 1] || {};
    const page = i + 1;
    out.push({
      id: `gen-${String(page).padStart(2, "0")}`,
      page,
      title: String(src.title || (page === 1 ? "封面" : `第 ${page} 页`)).slice(
        0,
        40,
      ),
      caption: String(
        src.caption ||
          (page === FREE_PAGES
            ? "试读到此。若要续看，可付费解锁后续页。"
            : "记忆的一页。"),
      ).slice(0, 160),
      beat: String(src.beat || src.imagePrompt || src.title || title).slice(
        0,
        200,
      ),
      imagePrompt: String(
        src.imagePrompt || src.prompt || src.beat || `${title} scene ${page}`,
      ).slice(0, 500),
    });
  }
  return out;
}

async function planBeatsWithLlm(title, text) {
  const body = (text || "").trim().slice(0, 12000);
  const system = `You are a documentary graphic-memoir editor.
Style references: Emmanuel Guibert ink-wash restraint, European nonfiction comics, quiet observational panels.
Output ONLY a JSON array of exactly ${FREE_PAGES} objects, no markdown.
Each object keys: page (1-${FREE_PAGES}), title (Chinese short), caption (Chinese, 1-2 literary sentences), imagePrompt (English visual description for image model).
Rules:
- page 1: cover of the autobiography/diary (recognizable bookish cover or personal notebook cover)
- pages 2-9: sequential key moments from the source (or plausible public-life skeleton if only a famous name is given)
- page 10: soft closing / free-preview ends mood
- captions are Chinese; imagePrompt English; no readable text inside imagePrompt
- not photorealistic celebrity portrait; soft ink figures
- no unrelated WWII / Alan's War military scenes`;

  const user = body
    ? `Title: ${title}\n\nSource text (diary or autobiography excerpt):\n${body}`
    : `Title only (public figure autobiography or diary name): ${title}\nBuild 10 pages from well-known public narrative skeleton; do not invent private secrets.`;

  const content = await xaiChat([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
  return normalizeBeats(extractJson(content), title);
}

function planBeatsOffline(title, text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks = [];
  if (lines.length) {
    const step = Math.max(1, Math.ceil(lines.length / 8));
    for (let i = 0; i < lines.length && chunks.length < 8; i += step) {
      chunks.push(lines.slice(i, i + step).join(" ").slice(0, 80));
    }
  }
  while (chunks.length < 8) {
    chunks.push(`${title} · 记忆片段 ${chunks.length + 1}`);
  }

  const beats = [
    {
      page: 1,
      title: "封面",
      caption: `《${title}》。以下为水墨纪实试读，情节为艺术化节选。`,
      imagePrompt: `book cover for memoir titled abstractly, soft paper texture, muted gray ink, no real logos`,
      beat: "cover",
    },
  ];
  for (let i = 0; i < 8; i++) {
    const excerpt = chunks[i];
    beats.push({
      page: i + 2,
      title: `节拍 ${i + 1}`,
      caption: excerpt,
      imagePrompt: `quiet life moment inspired by: ${excerpt}. indoor/outdoor soft gray ink wash sequential panel`,
      beat: excerpt.slice(0, 60),
    });
  }
  beats.push({
    page: 10,
    title: "试读结束",
    caption: "免费十页到此。后续章节可付费续看。",
    imagePrompt: `closed notebook on windowsill dawn, contemplative gray watercolor, last free page mood`,
    beat: "free ends",
  });
  return normalizeBeats(beats, title);
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLines(text, maxLen = 18, maxLines = 6) {
  const chars = [...String(text)];
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
  return lines;
}

/** 无 API 时的水墨风 SVG 页（可被 <img> 直接引用） */
function buildInkSvg({ page, title, caption, novelTitle }) {
  const titleLines = wrapLines(title, 12, 2);
  const capLines = wrapLines(caption, 16, 5);
  const yTitle = 120;
  const yCap = 520;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="864" height="1152" viewBox="0 0 864 1152">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f3f0e8"/>
      <stop offset="100%" stop-color="#d9d4c8"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0.08 0"/>
    </filter>
  </defs>
  <rect width="864" height="1152" fill="url(#bg)"/>
  <rect width="864" height="1152" filter="url(#grain)" opacity="0.5"/>
  <rect x="48" y="48" width="768" height="1056" fill="none" stroke="#5c574c" stroke-width="2" opacity="0.35"/>
  <path d="M120 280 C280 180, 420 360, 560 240 S760 320, 720 420" fill="none" stroke="#3a3832" stroke-width="3" opacity="0.25"/>
  <path d="M160 700 C300 620, 400 780, 620 680 S780 760, 700 860" fill="none" stroke="#4a4640" stroke-width="2.5" opacity="0.2"/>
  <circle cx="430" cy="380" r="90" fill="#6b6660" opacity="0.12"/>
  <text x="72" y="90" font-family="Songti SC, STSong, serif" font-size="18" fill="#6a655c">${escapeXml(novelTitle)} · p${page}</text>
  ${titleLines
    .map(
      (ln, i) =>
        `<text x="72" y="${yTitle + i * 48}" font-family="Songti SC, STSong, serif" font-size="40" fill="#2c2a26">${escapeXml(ln)}</text>`,
    )
    .join("\n  ")}
  ${capLines
    .map(
      (ln, i) =>
        `<text x="72" y="${yCap + i * 36}" font-family="Songti SC, STSong, serif" font-size="26" fill="#3f3c36">${escapeXml(ln)}</text>`,
    )
    .join("\n  ")}
  <text x="72" y="1080" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#8a857a">ink placeholder · set XAI_API_KEY for real panels</text>
</svg>`;
}

async function mapPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let idx = 0;
  async function run() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await worker(items[i], i);
    }
  }
  const n = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: n }, () => run()));
  return results;
}

/**
 * @param {object} opts
 * @param {string} opts.root project root
 * @param {string} opts.jobId
 * @param {string} opts.title
 * @param {string} [opts.text]
 * @param {(patch: object) => void} opts.onProgress
 */
export async function generateGraphicNovel({
  root,
  jobId,
  title,
  text = "",
  onProgress = () => {},
}) {
  const cleanTitle = String(title || "").trim().slice(0, 80) || "未命名日记";
  const outDir = path.join(root, "public", "graphic", "generated", jobId);
  fs.mkdirSync(outDir, { recursive: true });

  const useApi = hasXaiKey();
  onProgress({
    status: "running",
    progress: 5,
    message: useApi
      ? "正在用 xAI 拆解十个叙事节拍…"
      : "未配置 XAI_API_KEY，使用离线节拍 + SVG 占位图…",
    mode: useApi ? "xai" : "offline",
  });

  let beats;
  try {
    beats = useApi
      ? await planBeatsWithLlm(cleanTitle, text)
      : planBeatsOffline(cleanTitle, text);
  } catch (e) {
    // LLM 失败时降级离线，仍可出 10 页
    console.warn("[graphic-generate] LLM failed, offline beats:", e.message);
    beats = planBeatsOffline(cleanTitle, text);
    onProgress({
      status: "running",
      progress: 12,
      message: `节拍 API 失败，已降级离线：${e.message}`,
      mode: "offline",
    });
  }

  onProgress({
    status: "running",
    progress: 15,
    message: `节拍就绪，开始生成 ${beats.length} 页画面…`,
    beatsPreview: beats.map((b) => ({ page: b.page, title: b.title })),
  });

  const pages = [];
  let doneCount = 0;

  await mapPool(beats, useApi ? 2 : 4, async (beat) => {
    const baseName = String(beat.page).padStart(2, "0");
    let relImage;
    let ext;

    if (useApi) {
      try {
        const buf = await xaiImage(beat.imagePrompt);
        ext = "jpg";
        const file = path.join(outDir, `${baseName}.${ext}`);
        fs.writeFileSync(file, buf);
        relImage = `/graphic/generated/${jobId}/${baseName}.${ext}`;
      } catch (e) {
        console.warn(`[graphic-generate] image p${beat.page} failed:`, e.message);
        ext = "svg";
        const svg = buildInkSvg({
          page: beat.page,
          title: beat.title,
          caption: beat.caption,
          novelTitle: cleanTitle,
        });
        fs.writeFileSync(path.join(outDir, `${baseName}.${ext}`), svg, "utf8");
        relImage = `/graphic/generated/${jobId}/${baseName}.${ext}`;
      }
    } else {
      ext = "svg";
      const svg = buildInkSvg({
        page: beat.page,
        title: beat.title,
        caption: beat.caption,
        novelTitle: cleanTitle,
      });
      fs.writeFileSync(path.join(outDir, `${baseName}.${ext}`), svg, "utf8");
      relImage = `/graphic/generated/${jobId}/${baseName}.${ext}`;
    }

    pages.push({
      id: beat.id,
      page: beat.page,
      title: beat.title,
      caption: beat.caption,
      beat: beat.beat,
      image: relImage,
    });

    doneCount += 1;
    const progress = 15 + Math.round((doneCount / beats.length) * 80);
    onProgress({
      status: "running",
      progress,
      message: `已生成 ${doneCount}/${beats.length} 页`,
    });
  });

  pages.sort((a, b) => a.page - b.page);

  const novel = {
    id: jobId,
    title: cleanTitle,
    subtitle: useApi
      ? "图像小说 · xAI 即时生成 · 免费 10 页"
      : "图像小说 · 离线占位生成 · 免费 10 页（配置 XAI_API_KEY 可出真图）",
    authorNote:
      "由输入的自传/日记名称与正文自动拆解节拍生成。画面语汇参考水墨纪实与欧陆非虚构图像小说；人物为艺术化诠释，非写实肖像。情节为公开叙事骨架或文本改写，非原著原文。",
    freePages: FREE_PAGES,
    totalPlanned: FREE_PAGES,
    packSize: 10,
    pricePerPackYuan: 1,
    priceHint: "免费前 10 页；续看 ¥1 / 10 页（微信到账确认）",
    styleLabel: "水墨纪实 · 即时生成",
    pages,
    generated: true,
    mode: useApi ? "xai" : "offline",
    createdAt: new Date().toISOString(),
  };

  const manifestPath = path.join(outDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(novel, null, 2) + "\n");

  onProgress({
    status: "done",
    progress: 100,
    message: "生成完成",
    novel,
  });

  return novel;
}

export function loadGeneratedNovel(root, jobId) {
  const manifestPath = path.join(
    root,
    "public",
    "graphic",
    "generated",
    jobId,
    "manifest.json",
  );
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

export function getGenerateCapabilities() {
  return {
    xaiConfigured: hasXaiKey(),
    chatModel: CHAT_MODEL,
    imageModel: IMAGE_MODEL,
    freePages: FREE_PAGES,
  };
}
