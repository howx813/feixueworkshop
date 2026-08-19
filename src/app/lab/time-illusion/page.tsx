import type { Metadata } from "next";
import Link from "next/link";
import TimeIllusion from "@/components/TimeIllusion";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "时间幻觉",
  description: `${site.name}${labMeta.name} · 爱因斯坦名言 + 星空中半透明晶体连续变形。`,
};

export default function TimeIllusionPage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}视觉玩具
      </p>
      <h1 className="page-title">时间幻觉</h1>
      <p className="page-desc">
        相信物理学的人知道：过去、现在与未来之间的分别，不过是一种顽固的幻觉。星空里一块半透明晶体缓缓旋转、连续变形——复刻灵感来自
        PioneerInPhys 的短视频。
      </p>

      <TimeIllusion />

      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
