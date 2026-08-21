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
        {" · "}WebGL 物理模拟
      </p>
      <h1 className="page-title">流体实验室</h1>
      <p className="page-desc">
        GPU 加速的 Navier-Stokes 流体求解器。拖动注入高速染料，观察涡旋、对流与扩散——着色器实时渲染，手机上也流畅。
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
