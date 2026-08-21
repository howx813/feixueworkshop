import type { Metadata } from "next";
import Link from "next/link";
import LivingRoom3D from "@/components/LivingRoom3D";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "3D 客厅",
  description: `${site.name}${labMeta.name} · Three.js 打造的 3D 客厅：柔和全局光照、真实阴影、程序生成橡木地板，壁挂电视播放猫鼠追逐。`,
};

export default function LivingRoomPage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}Three.js 场景
      </p>
      <h1 className="page-title">3D 客厅</h1>
      <p className="page-desc">
        用 Three.js 搭的一间客厅：柔和的全局光照、真实的软阴影、程序生成的橡木地板——而壁挂电视里，一只猫正在永远追不上那只老鼠。拖拽环绕，滚轮推近。
      </p>

      <LivingRoom3D />

      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
