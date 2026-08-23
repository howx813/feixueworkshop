import type { Metadata } from "next";
import Link from "next/link";
import TenderGalaxy from "@/components/TenderGalaxy";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "标讯星图",
  description: `${site.name}${labMeta.name} · 每颗星是一条真实标讯：行业聚成星团，金额决定亮度，星级染出颜色——你的商机宇宙，可漫游。`,
};

export default function TenderGalaxyPage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}数据可视化
      </p>
      <h1 className="page-title">标讯星图</h1>
      <p className="page-desc">
        每一颗星都是一条真实标讯，来自商机雷达的每日扫描。行业聚成星团，金额点亮亮度，星级染成颜色。拖拽漫游这片宇宙——它们不只是好看，每一颗都能点开原文。
      </p>

      <TenderGalaxy />

      <div style={{ marginTop: 20 }}>
        <Link href="/tenders/" className="btn btn-ghost">
          ← 去标讯雷达看明细
        </Link>
      </div>
    </div>
  );
}
