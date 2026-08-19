import type { Metadata } from "next";
import Link from "next/link";
import { insights, site } from "@/data/content";
import type { WechatMpFile } from "@/lib/wechat-mp";
import { WechatMpBoard } from "@/components/WechatMpBoard";
import wechatData from "@/data/wechat-mp.generated.json";

export const metadata: Metadata = {
  title: "观点精选",
  description: `${site.name}观点精选与公众号「朝诗夕文」文章同步。`,
};

const wechatInitial = wechatData as WechatMpFile;

export default function InsightsPage() {
  return (
    <div className="page">
      <p className="page-kicker">Insights</p>
      <h1 className="page-title">观点精选</h1>
      <p className="page-desc">
        站内短判断 + 公众号「朝诗夕文」已发表文章。仅收录可证实已发布的条目（官方已发表接口，或发表记录里的永久链接）；草稿不上站。
      </p>

      <WechatMpBoard initial={wechatInitial} />

      <section className="section" style={{ marginTop: 28 }}>
        <div className="day-bar">
          <strong>站内精选 {insights.length} 条</strong>
          <span>短结论优先</span>
        </div>

        <div className="list-stack">
          {insights.map((item, index) => (
            <article key={item.id} className="card card-pad">
              <div className="meta-row">
                <span
                  className={`score-pill ${index < 2 ? "score-high" : "score-mid"}`}
                >
                  {90 - index * 4}
                </span>
                <span className="chip chip-amber">{item.category}</span>
                <span>{item.date}</span>
                <span>#{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h2 className="item-title" style={{ fontSize: "1.0625rem" }}>
                {item.title}
              </h2>
              <p className="item-body">{item.summary}</p>
              <div className="note">
                <strong style={{ fontWeight: 650 }}>推荐理由：</strong>
                {item.takeaway}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="card-quiet card-pad" style={{ marginTop: 24 }}>
        <h2 className="item-title" style={{ marginTop: 0 }}>
          同步说明
        </h2>
        <p className="item-body">
          个人号常无「已发表列表」API。请到公众平台{" "}
          <strong>内容管理 → 发表记录</strong> 复制永久链接，写入{" "}
          <code className="inline-code">data/wechat-mp-published-urls.txt</code>
          ，再执行 <code className="inline-code">npm run wechat:sync</code>
          。勿使用带 tempkey 的预览链。AppSecret 仅存 .env.local。
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          <Link href="/showcase/" className="btn btn-ghost">
            返回展厅
          </Link>
          <Link href="/#contact" className="btn btn-primary">
            交流观点
          </Link>
        </div>
      </div>
    </div>
  );
}
