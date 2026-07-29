import type { Metadata } from "next";
import Link from "next/link";
import LifeGame from "@/components/LifeGame";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "生命游戏",
  description: `${site.name}${labMeta.name} · 康威生命游戏：元胞自动机经典演示。`,
};

export default function LifePage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}元胞自动机
      </p>
      <h1 className="page-title">生命游戏</h1>
      <p className="page-desc">
        康威生命游戏（Conway&apos;s Game of Life）：在一个由细胞组成的网格上，每个细胞根据周围邻居的数量决定下一刻的生死——简单的规则孕育出复杂的行为。点击画布播种，或加载经典图案观察演化。
      </p>

      <LifeGame />

      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
