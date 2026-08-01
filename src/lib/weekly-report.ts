/**
 * /weekly 站点周报类型与拉取（密码门后的内容，客户端加载）
 */

export type WeeklyItem = {
  title: string;
  city: string;
  moneyText: string;
  bidDeadline: string;
  firstSeenAt: string;
  sourceUrl: string;
};

export type WeeklyReportFile = {
  schemaVersion: number;
  generatedAt: string;
  week: string;
  range: { from: string; to: string };
  insight: string;
  overview: {
    newCount: number;
    activeCount: number;
    expiredCount: number;
    fiveStarCount: number;
    totalMoneyWan: number;
    comparable: boolean;
    historyDays: number;
  };
  fiveStar: WeeklyItem[];
  deadlineSoon: WeeklyItem[];
  moversUp: { name: string; prev: number; curr: number; delta: number }[];
  health: { days: number; ok: number; fail: number; agentRuns: number; agentOk: number };
  dataAsOf: string;
  copyText: string;
};

export const WEEKLY_REPORT_PATH = "/data/weekly-report.json";

export async function fetchWeeklyReport(
  signal?: AbortSignal,
): Promise<WeeklyReportFile> {
  const res = await fetch(WEEKLY_REPORT_PATH, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`周报数据不可用 (${res.status})`);
  return (await res.json()) as WeeklyReportFile;
}
