export type MusicTrack = {
  id: number;
  name: string;
  artist: string;
  album?: string;
  cover?: string;
  /**
   * free: 可免登录试听（优先用 HTML5 播放）
   * vip: 有版权限制，引导去网易云 App/网页听
   */
  access: "free" | "vip";
};

/**
 * 飞雪的「喜欢」曲库。
 * - 可手改本列表
 * - 或设置 NETEASE_PLAYLIST_ID 后运行: npm run music:sync
 *
 * 说明：
 * 网易云多数热门曲有版权（fee），在第三方网站外链/匿名拉流会失败。
 * free 曲目走可试听源；vip 曲目引导官方页，避免“点了没声”。
 */
export const musicConfig = {
  title: "工坊电台",
  subtitle: "打开随机一首；可试听曲直接播放，版权曲跳转网易云",
  sourceLabel: "网易云 · 工坊曲库",
  playlistId: null as number | null,
};

/**
 * 默认曲库：优先可试听曲目，保证线上能出声。
 * id 必须是网易云真实歌曲 ID。
 */
export const favoriteTracks: MusicTrack[] = [
  {
    id: 29436904,
    name: "南山南",
    artist: "马頔",
    album: "南山南",
    access: "free",
  },
  {
    id: 31445554,
    name: "七月上",
    artist: "Jam",
    album: "阿敬的单曲集",
    access: "free",
  },
  {
    id: 31445772,
    name: "理想三旬",
    artist: "陈鸿宇",
    album: "浓烟下的诗歌电台",
    access: "free",
  },
  {
    id: 27646198,
    name: "董小姐",
    artist: "宋冬野",
    album: "安和桥北",
    access: "free",
  },
  {
    id: 477251491,
    name: "郭源潮",
    artist: "宋冬野",
    album: "郭源潮",
    access: "free",
  },
  {
    id: 571338083,
    name: "醒着醉",
    artist: "马良",
    album: "往后余生",
    access: "free",
  },
  {
    id: 1303027499,
    name: "总有一天你会出现在我身边",
    artist: "棱镜乐队",
    album: "一次有预谋的初次相遇",
    access: "free",
  },
  {
    id: 28815250,
    name: "平凡之路",
    artist: "朴树",
    album: "猎户星座",
    access: "vip",
  },
  {
    id: 186016,
    name: "晴天",
    artist: "周杰伦",
    album: "叶惠美",
    access: "vip",
  },
  {
    id: 436514312,
    name: "成都",
    artist: "赵雷",
    album: "成都",
    access: "vip",
  },
];

/** 第三方 meting 代理：仅用于可试听曲的直链；失败则回退官方页 */
export function metingUrl(songId: number) {
  return `https://api.injahow.cn/meting/?server=netease&type=url&id=${songId}`;
}

export function outchainSongUrl(songId: number, auto = false) {
  return `https://music.163.com/outchain/player?type=2&id=${songId}&auto=${auto ? 1 : 0}&height=66`;
}

export function songPageUrl(songId: number) {
  return `https://music.163.com/#/song?id=${songId}`;
}

export function playlistOutchainUrl(playlistId: number, auto = false) {
  return `https://music.163.com/outchain/player?type=0&id=${playlistId}&auto=${auto ? 1 : 0}&height=280`;
}
