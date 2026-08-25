/**
 * 副职考核指标看板（/weekly 密码门后，完整版含金额）
 * schemaVersion 1：飞雪2026副职业绩考核（合同3000万/权重60 + 收款2200万/权重40）
 * 数据源 public/data/kpi-dashboard.json（客户端加载，可热刷更新）
 */

export type KpiMetric = {
  key: string;
  name: string;
  weight: number;
  annualTarget: number;
  unit: string;
  quarterlyNodes: number[];
  currentCumulative: number;
  currentMonth: string;
  currentRate: number; // 年度口径完成率 0-1
  quarterRate: number; // 序时（对应当前季度节点）完成率 0-1
  quarterNode: string;
  augTarget: number;
  scoring: { deductPer1pct: number; bonusPer1pct: number; bonusCap: number };
  score: number;
  note: string;
};

export type KpiScenario = {
  name: string;
  contractRate: number;
  receiptRate: number;
  total: number;
  contractNeed?: number;
  receiptNeed?: number;
  contractMonthly?: number;
  receiptMonthly?: number;
};

export type KpiDashboardFile = {
  schemaVersion: number;
  generatedAt: string;
  updatedNote: string;
  owner: string;
  role: string;
  metrics: KpiMetric[];
  scoreNow: number;
  scoreFull: number;
  scenarios: KpiScenario[];
  otherIndicators: { name: string; status: string; desc: string }[];
  warnings: string[];
};

export const KPI_DASHBOARD_PATH = "/data/kpi-dashboard.json";

export async function fetchKpiDashboard(
  signal?: AbortSignal,
): Promise<KpiDashboardFile> {
  const res = await fetch(KPI_DASHBOARD_PATH, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`看板数据不可用 (${res.status})`);
  return (await res.json()) as KpiDashboardFile;
}
