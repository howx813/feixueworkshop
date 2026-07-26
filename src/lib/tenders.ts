export type MatchedQual = {
  id: string;
  name: string;
  entity: string;
};

export type TenderItem = {
  id: string;
  title: string;
  tenderType: string;
  date: string;
  publishTime?: string;
  province: string;
  city: string;
  buyer: string;
  moneyWan: number;
  professions: string[];
  matchedQuals: MatchedQual[];
  score: number;
  sourceUrl: string;
  platformUrl: string;
  stageName?: string;
  purchaseTypeName?: string;
};

export type TendersFile = {
  syncedAt: string;
  since: string;
  matchedCount: number;
  softwareCount: number;
  authenticated?: boolean;
  note: string;
  items: TenderItem[];
};

/** 静态托管下的热更新路径（方案 C：sync 后写入 public/data） */
export const TENDERS_PUBLIC_PATH = "/data/tenders.json";

export function formatTenderMoney(wan: number) {
  if (!wan || wan <= 0) return "金额未披露";
  if (wan >= 10000) return `${(wan / 10000).toFixed(2)} 亿元`;
  return `${wan.toFixed(wan >= 100 ? 0 : 2)} 万元`;
}

export function tenderScoreClass(score: number) {
  if (score >= 70) return "score-high";
  if (score >= 45) return "score-mid";
  return "";
}

export async function fetchTendersPublic(
  signal?: AbortSignal,
): Promise<TendersFile> {
  const res = await fetch(TENDERS_PUBLIC_PATH, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`标讯快照不可用 (${res.status})`);
  }
  return (await res.json()) as TendersFile;
}
