import type { Metadata } from "next";
import Link from "next/link";
import PagodaGarden from "@/components/PagodaGarden";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "体素宝塔花园",
  description: `${site.name}${labMeta.name} · 程序生成的体素宝塔花园：轨道环绕、零资源加载，每个方块一次成形。`,
};

export default function PagodaPage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}体素世界
      </p>
      <h1 className="page-title">体素宝塔花园</h1>
      <p className="page-desc">
        一座完全可探索的悬浮花园岛：五重塔、樱花、竹林、石灯笼与池塘。世界由种子程序生成——拖拽环绕，滚轮推近，换一颗种子就是另一座花园。零资源加载：每个方块都是一次成形的纯色体素。
      </p>

      <PagodaGarden />

      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
