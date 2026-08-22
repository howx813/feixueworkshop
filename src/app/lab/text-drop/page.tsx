import type { Metadata } from "next";
import Link from "next/link";
import TextDrop from "@/components/TextDrop";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "一字千钧",
  description: `${site.name}${labMeta.name} · 输入一段文字让它落下：自由落体、碰撞堆叠、可拖拽抛掷——你打出的每个字都有重量。`,
};

export default function TextDropPage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}物理沙盒
      </p>
      <h1 className="page-title">一字千钧</h1>
      <p className="page-desc">
        你打出的每个字都有重量。输入一段话，看着它们从天上掉下来、碰撞、翻滚、堆成小山。可以抓起来扔出去，也可以反转重力让整段话飞上天。
      </p>

      <TextDrop />

      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
