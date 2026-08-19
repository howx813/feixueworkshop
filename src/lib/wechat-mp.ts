export type WechatMpArticle = {
  id: string;
  articleId: string;
  title: string;
  author: string;
  digest: string;
  url: string;
  thumbUrl: string;
  publishedAt: string;
  showCover?: boolean;
};

export type WechatMpFile = {
  syncedAt: string;
  source: string;
  /** published = 已发表列表；draft-fallback = 草稿箱回退 */
  mode?: string;
  accountName: string;
  appIdMasked: string;
  totalCount: number;
  itemCount: number;
  note: string;
  items: WechatMpArticle[];
};

export const WECHAT_MP_PUBLIC_PATH = "/data/wechat-mp.json";

export function formatWechatDate(iso: string) {
  if (!iso) return "日期未知";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export async function fetchWechatMpPublic(
  signal?: AbortSignal,
): Promise<WechatMpFile> {
  const res = await fetch(WECHAT_MP_PUBLIC_PATH, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`公众号快照不可用 (${res.status})`);
  return (await res.json()) as WechatMpFile;
}
