export type MusicTrack = {
  id: number;
  name: string;
  artist: string;
  album?: string;
  cover?: string;
};

/**
 * 飞雪的「喜欢」曲库。
 * - 可手改本列表
 * - 或设置 NETEASE_PLAYLIST_ID 后运行: npm run music:sync
 *
 * 播放走网易云官方外链播放器（合法嵌入），不在前端暴露 AppSecret/PrivateKey。
 */
export const musicConfig = {
  title: "工坊电台",
  subtitle: "打开即随机播放一首我喜欢的歌",
  sourceLabel: "网易云 · 我喜欢的",
  /** 可选：整张歌单外链备用 */
  playlistId: null as number | null,
};

/**
 * 默认曲库（可替换为你的真实喜欢列表）
 * 注意：id 必须是网易云真实歌曲 ID，展示文案以 id 对应曲目为准。
 * 可用 scripts/sync-music.mjs 从歌单同步，避免手填错号。
 */
export const favoriteTracks: MusicTrack[] = [
  {
    id: 347230,
    name: "海阔天空",
    artist: "Beyond",
    album: "海阔天空",
  },
  {
    id: 186016,
    name: "晴天",
    artist: "周杰伦",
    album: "叶惠美",
  },
  {
    id: 108914,
    name: "江南",
    artist: "林俊杰",
    album: "第二天堂",
  },
  {
    id: 31445772,
    name: "理想三旬",
    artist: "陈鸿宇",
    album: "浓烟下的诗歌电台",
  },
  {
    id: 436514312,
    name: "成都",
    artist: "赵雷",
    album: "成都",
  },
  {
    id: 32507038,
    name: "演员",
    artist: "薛之谦",
    album: "绅士",
  },
  {
    id: 28815250,
    name: "平凡之路",
    artist: "朴树",
    album: "猎户星座",
  },
  {
    id: 27646198,
    name: "董小姐",
    artist: "宋冬野",
    album: "安和桥北",
  },
];

export function outchainSongUrl(songId: number, auto = true) {
  return `https://music.163.com/outchain/player?type=2&id=${songId}&auto=${auto ? 1 : 0}&height=66`;
}

export function songPageUrl(songId: number) {
  return `https://music.163.com/#/song?id=${songId}`;
}

export function playlistOutchainUrl(playlistId: number, auto = true) {
  return `https://music.163.com/outchain/player?type=0&id=${playlistId}&auto=${auto ? 1 : 0}&height=280`;
}
