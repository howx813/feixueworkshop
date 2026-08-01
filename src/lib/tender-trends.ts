/**
 * 标讯趋势 / AI 工作日报 类型与运行时热刷（M2）
 * 产物由 scripts/aggregate-tenders.mjs 双写生成，口径见
 * docs/p0-tenders-radar-design.md v1.2 §3.2 / §3.3
 */

export type TrendWeek = {
  week: string;
  from: string;
  newCount: number;
  activeCount: number;
  expiredCount: number;
  fiveStarCount: number;
  totalMoneyWan: number;
};

export type CityCount = { name: string; count: number; moneyWan: number };
export type NamedCount = { name: string; count: number };
export type MoneyBucket = { bucket: string; count: number };
export type BuyerCount = { buyer: string; count: number };
export type SyncHealthDay = { date: string; ok: boolean };

export type TrendHighlight = {
  id: string;
  title: string;
  stars: number;
  firstSeenAt: string;
  lastSeenAt: string;
  seenCount: number;
  moneyWan: number;
  city: string;
  buyer: string;
  bidDeadline: string;
  sourceUrl: string;
};

export type TenderTrendsFile = {
  schemaVersion: number;
  generatedAt: string;
  historyFrom: string;
  dataAsOf: string;
  syncHealth: SyncHealthDay[];
  totals: { tracked: number; active: number; expired: number };
  weekly: TrendWeek[];
  byCity: CityCount[];
  byProfession: NamedCount[];
  moneyBuckets: MoneyBucket[];
  topBuyers: BuyerCount[];
  highlights: TrendHighlight[];
};

export type AgentActivityEntry = {
  ts: string;
  agent: string;
  ok: boolean;
  newCount: number;
  activeCount: number;
  artifacts: string[];
  note: string;
};

export type AgentActivityFile = {
  schemaVersion: number;
  generatedAt: string;
  entries: AgentActivityEntry[];
};

export const TRENDS_PUBLIC_PATH = "/data/tender-trends.json";
export const ACTIVITY_PUBLIC_PATH = "/data/agent-activity.json";

export async function fetchTenderTrends(
  signal?: AbortSignal,
): Promise<TenderTrendsFile> {
  const res = await fetch(TRENDS_PUBLIC_PATH, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`趋势数据不可用 (${res.status})`);
  return (await res.json()) as TenderTrendsFile;
}

export async function fetchAgentActivity(
  signal?: AbortSignal,
): Promise<AgentActivityFile> {
  const res = await fetch(ACTIVITY_PUBLIC_PATH, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`日报数据不可用 (${res.status})`);
  return (await res.json()) as AgentActivityFile;
}

/** 万元金额缩写：450 → 450万；12000 → 1.2亿 */
export function formatWan(wan: number): string {
  if (!wan || wan <= 0) return "未披露";
  if (wan >= 10000) return `${(wan / 10000).toFixed(1).replace(/\.0$/, "")}亿`;
  return `${wan}万`;
}
