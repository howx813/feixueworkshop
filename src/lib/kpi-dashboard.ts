/**
 * 指标看板（/weekly 密码门后，三板块：集客经营 / 科创 / 纪检）
 * schemaVersion 2：统一指标看板，飞雪分管条线
 * 数据源 public/data/kpi-dashboard.json（客户端加载，可热刷更新）
 */

export type BusinessMetric = {
  key: string;
  name: string;
  weight: number;
  annualTarget: number;
  unit: string;
  quarterlyNodes: number[];
  currentCumulative: number;
  currentMonth: string;
  currentRate: number;
  quarterRate: number;
  quarterNode: string;
  augTarget: number;
  scoring: { deductPer1pct: number; bonusPer1pct: number; bonusCap: number };
  score: number;
  note: string;
};

export type InnovationKpi = {
  key: string;
  name: string;
  type: string;
  rule: string;
  status?: string;
  progressNote?: string;
};

export type DisciplineIndicator = {
  criterion: string;
  max: number;
  prev: number;
  isBonus?: boolean;
  isDeduct?: boolean;
};

export type DisciplineTask = {
  content: string;
  deadline: string;
  status: string;
  progress?: string;
};

export type KpiDashboardFile = {
  schemaVersion: number;
  generatedAt: string;
  owner: string;
  role: string;
  note: string;
  sections: {
    business: {
      name: string;
      icon: string;
      metrics: BusinessMetric[];
      scoreNow: number;
      scoreFull: number;
      scenarios: { name: string; total: number; contractNeed?: number; receiptNeed?: number; contractMonthly?: number; receiptMonthly?: number }[];
      warnings: string[];
    };
    innovation: {
      name: string;
      icon: string;
      kpi: InnovationKpi[];
      kciFramework: { note: string; reviewCycle: string };
      warnings: string[];
    };
    discipline: {
      name: string;
      icon: string;
      yearPrev: string;
      prevScore: number;
      fullScore: number;
      indicatorGroups: { group: string; items: DisciplineIndicator[] }[];
      tasks: DisciplineTask[];
    };
  };
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
