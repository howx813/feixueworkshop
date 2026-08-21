import type { Metadata } from "next";
import Link from "next/link";
import Ai2048 from "@/components/Ai2048";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "AI 解 2048",
  description: `${site.name}${labMeta.name} · expectimax 算法自动打 2048，看 AI 怎么把牌面盘成蛇。`,
};

export default function Ai2048Page() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}算法演示
      </p>
      <h1 className="page-title">AI 解 2048</h1>
      <p className="page-desc">
        expectimax 搜索 + 启发式评估：空格、单调性、平滑度、大数压角。按下按钮，看 AI 把散乱的牌面盘成一条蛇，一路打穿 2048。也可以自己用方向键玩，再让 AI 接盘。
      </p>

      <Ai2048 />

      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
