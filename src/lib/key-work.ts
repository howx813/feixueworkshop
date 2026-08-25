/**
 * 每周重点工作安排（/weekly，例会主持用）
 * 五板块：生产经营 / 科创 / 纪检 / 党建 / 安全与合规
 * 数据源 public/data/key-work.json
 */

export type WorkItem = {
  task: string;
  owner: string;
  deadline: string;
  source?: string;
};

export type KeyWorkSection = {
  name: string;
  icon: string;
  weight?: string;
  items: WorkItem[];
};

export type KeyWorkFile = {
  schemaVersion: number;
  generatedAt: string;
  owner: string;
  note: string;
  meeting: { name: string; host: string; time: string; rule: string };
  sections: KeyWorkSection[];
};

export const KEY_WORK_PATH = "/data/key-work.json";

export async function fetchKeyWork(signal?: AbortSignal): Promise<KeyWorkFile> {
  const res = await fetch(KEY_WORK_PATH, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`重点工作数据不可用 (${res.status})`);
  return (await res.json()) as KeyWorkFile;
}
