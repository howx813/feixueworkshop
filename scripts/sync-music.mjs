/**
 * 从公开可访问的网易云歌单同步曲目到 src/data/music-songs.generated.json
 *
 * 用法:
 *   NETEASE_PLAYLIST_ID=123456 npm run music:sync
 *
 * 说明:
 * - 「我喜欢的音乐」需在网页端打开歌单，复制 URL 中的 id
 * - 歌单需可访问（私密歌单可能拉不到）
 * - 开放平台密钥用于后续服务端能力，本脚本走公开歌单接口
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const playlistId = process.env.NETEASE_PLAYLIST_ID;
if (!playlistId) {
  console.error("缺少 NETEASE_PLAYLIST_ID。请写入 .env.local 或命令行传入。");
  process.exit(1);
}

const url = `https://music.163.com/api/v6/playlist/detail?id=${playlistId}&n=1000`;
const res = await fetch(url, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    Referer: "https://music.163.com/",
  },
});

if (!res.ok) {
  console.error("请求失败", res.status);
  process.exit(1);
}

const data = await res.json();
if (data.code !== 200 || !data.playlist) {
  console.error("歌单不可用:", data.message || data.code);
  process.exit(1);
}

const tracks = (data.playlist.tracks || []).map((t) => ({
  id: t.id,
  name: t.name,
  artist: (t.ar || []).map((a) => a.name).join(" / ") || "未知艺术家",
  album: t.al?.name || "",
  cover: t.al?.picUrl || "",
}));

const out = {
  playlistId: Number(playlistId),
  playlistName: data.playlist.name,
  syncedAt: new Date().toISOString(),
  trackCount: tracks.length,
  tracks,
};

const outPath = path.join(root, "src/data/music-songs.generated.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(
  `已同步「${out.playlistName}」${out.trackCount} 首 → ${path.relative(root, outPath)}`,
);
