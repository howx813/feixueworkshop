import type { Metadata } from "next";
import Link from "next/link";
import ParticleLife from "@/components/ParticleLife";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "粒子生命",
  description: `${site.name}${labMeta.name} · Particle Life 涌现模拟：简单吸引/排斥规则，长出复杂图案。`,
};

export default function ParticleLifePage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}涌现模拟
      </p>
      <h1 className="page-title">粒子生命</h1>
      <p className="page-desc">
        几条颜色、一张「谁吸引谁」的规则表，粒子自己会长出丝、团、轨道。规则极简，好玩在涌现——点「随机规则」换一局宇宙。
      </p>

      <ParticleLife />

      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
