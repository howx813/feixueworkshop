import type { Metadata } from "next";
import Link from "next/link";
import { MarbleGame } from "@/components/MarbleGame";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "碎砖弹珠",
  description: `${site.name}${labMeta.name} · 弹珠打砖，打碎掉道具。`,
};

export default function MarblePage() {
  return (
    <div className="page page-wide">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}Arcade
      </p>
      <h1 className="page-title">碎砖弹珠</h1>
      <p className="page-desc">
        把球弹出去，打掉上方砖块。砖块会掉道具：多球、加宽、慢速、火力、生命。
        键盘 ← → 或 A/D 移动，空格发射 / 暂停。
      </p>
      <MarbleGame />
      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
