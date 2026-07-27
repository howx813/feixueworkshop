import type { Metadata } from "next";
import Link from "next/link";
import ParticleText from "@/components/ParticleText";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "字由粒子",
  description: `${site.name}${labMeta.name} · 汉字粒子化交互演示。`,
};

export default function ParticlesPage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}Canvas 交互
      </p>
      <h1 className="page-title">字由粒子</h1>
      <p className="page-desc">
        汉字化作万千粒子，鼠标一扫散开，静止后自动聚回成字。可输入任意文字或点击预设。
      </p>

      <ParticleText />

      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
