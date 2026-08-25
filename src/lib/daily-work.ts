/**
 * 每日重点工作安排（/weekly 密码门后，按部门/责任人分组）
 * schemaVersion 1：依据指标看板三板块推导，责任到人
 * 数据源 public/data/daily-work.json
 */

export type WorkTask = {
  task: string;
  freq: string;
  from?: string;
};

export type Department = {
  dept: string;
  person: string;
  domain: string;
  daily: WorkTask[];
  weekly: WorkTask[];
};

export type DailyWorkFile = {
  schemaVersion: number;
  generatedAt: string;
  owner: string;
  note: string;
  departments: Department[];
  rules: string[];
};

export const DAILY_WORK_PATH = "/data/daily-work.json";

export async function fetchDailyWork(
  signal?: AbortSignal,
): Promise<DailyWorkFile> {
  const res = await fetch(DAILY_WORK_PATH, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`工作安排数据不可用 (${res.status})`);
  return (await res.json()) as DailyWorkFile;
}
