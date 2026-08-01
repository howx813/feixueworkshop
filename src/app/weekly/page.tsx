import type { Metadata } from "next";
import { site } from "@/data/content";
import { WeeklyReport } from "@/components/WeeklyReport";

export const metadata: Metadata = {
  title: "工作周报",
  description: `${site.name}工作周报：每周五更新，需密码查看。`,
  robots: { index: false, follow: false },
};

export default function WeeklyPage() {
  return (
    <div className="page">
      <p className="page-kicker">Weekly</p>
      <h1 className="page-title">工作周报</h1>
      <p className="page-desc">每周五 18:00 更新 · 一周工作概览 · 简单明了版</p>
      <WeeklyReport />
    </div>
  );
}
