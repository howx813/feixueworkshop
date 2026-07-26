/** 图像小说：书目搜索生成 5 页 API 客户端 */

import type { GraphicNovel } from "@/data/graphic-novels";

export type GenerateJob = {
  id: string;
  title: string;
  status: "queued" | "running" | "done" | "error";
  progress: number;
  message: string;
  mode?: "xai" | "offline" | null;
  error?: string | null;
  createdAt: string;
  finishedAt?: string | null;
  novel?: GraphicNovel | null;
};

function apiBase() {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_PAY_API
      : undefined;
  return (fromEnv || "http://127.0.0.1:8787").replace(/\/$/, "");
}

export async function checkGraphicServer(): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}/v1/health`, { cache: "no-store" });
    const data = await res.json();
    return Boolean(res.ok && data.ok);
  } catch {
    return false;
  }
}

export async function startBookGenerate(query: string): Promise<GenerateJob> {
  const res = await fetch(`${apiBase()}/v1/graphic/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok || !data.job) {
    throw new Error(data.message || `生成失败 (${res.status})`);
  }
  return data.job as GenerateJob;
}

export async function fetchGenerateJob(jobId: string): Promise<GenerateJob> {
  const res = await fetch(
    `${apiBase()}/v1/graphic/jobs/${encodeURIComponent(jobId)}`,
    { cache: "no-store" },
  );
  const data = await res.json();
  if (!res.ok || !data.ok || !data.job) {
    throw new Error(data.message || `查询失败 (${res.status})`);
  }
  return data.job as GenerateJob;
}

export async function waitGenerateJob(
  jobId: string,
  opts?: {
    intervalMs?: number;
    onTick?: (job: GenerateJob) => void;
    signal?: AbortSignal;
  },
): Promise<GenerateJob> {
  const interval = opts?.intervalMs ?? 1200;
  for (;;) {
    if (opts?.signal?.aborted) throw new Error("已取消");
    const job = await fetchGenerateJob(jobId);
    opts?.onTick?.(job);
    if (job.status === "done" || job.status === "error") return job;
    await new Promise((r) => setTimeout(r, interval));
  }
}
