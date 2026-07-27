import type { Metadata } from "next";
import Link from "next/link";
import GravitySandbox from "@/components/GravitySandbox";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "引力沙盘",
  description: `${site.name}${labMeta.name} · 引力透镜式粒子流交互演示。`,
};

export default function GravityPage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}引力模拟
      </p>
      <h1 className="page-title">引力沙盘</h1>
      <p className="page-desc">
        一道粒子风横穿屏幕。点击放下的质量点像引力透镜一样把流线掰弯；吸引或排斥，由你切换。
      </p>

      <GravitySandbox />

      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
