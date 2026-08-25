import type { Metadata } from "next";
import { site } from "@/data/content";
import { WeeklyReport } from "@/components/WeeklyReport";
import { KeyWorkCard } from "@/components/KeyWork";
import { KpiDashboardCard } from "@/components/KpiDashboard";
import { DataLabelingCard } from "@/components/DataLabeling";
import { DashboardGate } from "@/components/DashboardGate";

export const metadata: Metadata = {
  title: "工作看板",
  description: `${site.name}工作看板：周报 / 重点工作 / 指标 / 数据标注。`,
  robots: { index: false, follow: false },
};

export default function WeeklyPage() {
  return (
    <DashboardGate>
      <div className="page">
        <p className="page-kicker">Dashboard</p>
        <h1 className="page-title">工作看板</h1>
        <p className="page-desc">周报 · 重点工作 · 指标 · 数据标注</p>
        <WeeklyReport />
        <div style={{ marginTop: 24 }}>
          <KeyWorkCard />
        </div>
        <div style={{ marginTop: 24 }}>
          <KpiDashboardCard />
        </div>
        <div style={{ marginTop: 24 }}>
          <DataLabelingCard />
        </div>
      </div>
    </DashboardGate>
  );
}
