/**
 * 指标看板（/weekly 密码门后，四板块：全院考核 / 徐昊考核(集客经营) / 科创 / 纪检）
 * schemaVersion 2：全院口径 + 飞雪分管条线
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

/** 全院月度考核指标（8月口径：全年预算 / 截至当月累计预算 / 当月累计完成） */
export type OrgMetric = {
  key: string;
  name: string;
  weight: number;
  annualTarget: number;     // 全年预算
  monthBudget: number;      // 截至当月累计预算（8月预算）
  currentCumulative: number; // 截至当月累计完成
  yearRate: number | null;  // 全年完成率（负值/无意义时为 null）
  monthRate: number | null; // 累计预算完成率（负值/无意义时为 null）
  score: number;            // 得分预测
  deduct: number;           // 扣分
  unit?: string;            // 单位，默认 万元
  note?: string;
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
    org: {
      name: string;
      icon: string;
      monthLabel: string;
      metrics: OrgMetric[];
      scoreNow: number;
      scoreFull: number;
      warnings: string[];
    };
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
