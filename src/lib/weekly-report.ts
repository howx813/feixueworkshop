/**
 * /weekly 工作周报类型与拉取（密码门后的内容，客户端加载）
 * schemaVersion 2：工作周报（Hermes 正文为主体），不再含标讯内容
 */

export type WeeklyReportFile = {
  schemaVersion: number;
  generatedAt: string;
  week: string;
  range: { from: string; to: string };
  hasWork: boolean;
  workText: string;
  health?: { agentRuns: number; agentOk: number; line: string } | null;
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
