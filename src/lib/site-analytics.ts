/**
 * /weekly 访问分析栏目数据（51la OpenAPI，scripts/sync-analytics.mjs 生成）
 * 客户端在密码门后拉取；文件不存在时栏目整体隐藏。
 */

export type SiteAnalyticsFile = {
  schemaVersion: number;
  source: string;
  generatedAt: string;
  range: { from: string; to: string };
  totals: { uv: number; pv: number; ip: number; sv: number; newUserCount: number };
  trend: {
    time: string;
    uv: number;
    pv: number;
    ip: number;
    sv: number;
    newUserCount: number;
  }[];
  regions: { region: string; sessions: number; pv: number; newVisitors: number }[];
  detailSessions: number;
};

export const SITE_ANALYTICS_PATH = "/data/site-analytics.json";

export async function fetchSiteAnalytics(
  signal?: AbortSignal,
): Promise<SiteAnalyticsFile | null> {
  try {
    const res = await fetch(SITE_ANALYTICS_PATH, {
      signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as SiteAnalyticsFile;
  } catch {
    return null;
  }
}
