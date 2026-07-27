import type { Metadata } from "next";
import Link from "next/link";
import FluidSimulation from "@/components/FluidSimulation";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "流体实验室",
  description: `${site.name}${labMeta.name} · 实时 Navier-Stokes 流体模拟。`,
};

export default function FluidPage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}Canvas 物理模拟
      </p>
      <h1 className="page-title">流体实验室</h1>
      <p className="page-desc">
        实时 Navier-Stokes 流体求解器。鼠标划过注入染料，观察扩散、涡旋与对流。可调整粘度与扩散系数。
      </p>

      <FluidSimulation />

      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
