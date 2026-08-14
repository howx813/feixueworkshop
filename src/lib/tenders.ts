export type MatchedQual = {
  id: string;
  name: string;
  domain?: string;
  entity?: string;
};

export type DeepAnalysis = {
  analyzedAt?: string;
  summary: string;
  matchedStandards?: string[];
  mustRequirements?: string[];
  mentionedInDoc?: string[];
  gaps?: string[];
  files?: { fileName: string; size?: number; error?: string | null }[];
  hasLocalDocs?: boolean;
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
  /** 1–5，综合匹配星级 */
  stars?: number;
  starScore?: number;
  starReasons?: string[];
  deepAnalysis?: DeepAnalysis;
  sourceUrl: string;
  platformUrl: string;
  stageName?: string;
  purchaseTypeName?: string;
  bidDeadline?: string;
  fileGetDeadline?: string;
  scaleText?: string;
  docFeeRequired?: boolean | null;
  docFeeText?: string;
  bondText?: string;
  qualSection?: string;
  qualHits?: string[];
  /** 专项标签：cta-ai=中电信人工智能科技；telecom-gz=电信贵州/数智 */
  focusTags?: string[];
};

export type TendersFile = {
  syncedAt: string;
  since: string;
  matchedCount: number;
  softwareCount: number;
  fiveStarCount?: number;
  ctaAiCount?: number;
  telecomGzCount?: number;
  deepAnalyzed?: number;
  authenticated?: boolean;
  note: string;
  items: TenderItem[];
};

export type TenderFocusFilter = "all" | "cta-ai" | "telecom-gz";

export function filterTendersByFocus(
  items: TenderItem[],
  focus: TenderFocusFilter,
): TenderItem[] {
  if (focus === "all") return items;
  return items.filter((i) => (i.focusTags || []).includes(focus));
}

export const TENDERS_PUBLIC_PATH = "/data/tenders.json";

export function formatTenderMoney(wan: number) {
  if (!wan || wan <= 0) return "金额未披露";
  if (wan >= 10000) return `${(wan / 10000).toFixed(2)} 亿元`;
  return `${wan.toFixed(wan >= 100 ? 0 : 2)} 万元`;
}

export function formatDocFee(item: TenderItem) {
  if (item.docFeeText) return item.docFeeText;
  if (item.docFeeRequired === false) return "不收取文件费用";
  if (item.docFeeRequired === true) return "需购买文件（见原文）";
  return "原文未写明";
}

export function formatStars(stars = 0) {
  const n = Math.max(0, Math.min(5, Math.round(stars)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function tenderScoreClass(score: number) {
  if (score >= 70) return "score-high";
  if (score >= 45) return "score-mid";
  return "";
}

export function starClass(stars = 0) {
  if (stars >= 5) return "star-5";
  if (stars >= 4) return "star-4";
  if (stars >= 3) return "star-3";
  return "star-low";
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
