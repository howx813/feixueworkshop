import type { Metadata } from "next";
import Link from "next/link";
import { SnowflakeDemo } from "@/components/SnowflakeDemo";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "雪花函数",
  description: `${site.name}${labMeta.name} · 经典三角科赫雪花（Koch snowflake）。`,
};

export default function LabSnowflakePage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}Koch snowflake
      </p>
      <h1 className="page-title">雪花函数</h1>
      <p className="page-desc">
        导航标采用候选 <strong>C</strong>：等边三角形上的科赫迭代（经典教科书版），不是贴图。
      </p>

      <div className="day-bar">
        <strong>
          F<sub>n+1</sub> = Koch(F<sub>n</sub>)
        </strong>
        <span>三角基底 · sides = 3</span>
      </div>

      <article className="card card-pad">
        <h2 className="item-title" style={{ marginTop: 0 }}>
          规则（人话版）
        </h2>
        <ol className="math-steps">
          <li>
            从<strong>等边三角形</strong>三条边出发。
          </li>
          <li>
            对每条边：三等分 → 中间<strong>向外</strong>折一个 60° 尖角。
          </li>
          <li>对每一小段重复 n 次。</li>
        </ol>
        <p className="item-body" style={{ marginTop: 12 }}>
          演示页可把基底边数拖到 6 看六角版；品牌标固定为{" "}
          <code className="inline-code">sides = 3</code>。
        </p>
        <p className="item-body" style={{ marginTop: 8 }}>
          周长：初始 L₀，第 n 次为{" "}
          <code className="inline-code">L₀ · (4/3)ⁿ</code>
          ，n→∞ 发散；面积有限。
        </p>
      </article>

      <SnowflakeDemo />

      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
