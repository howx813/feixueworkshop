import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/data/content";
import { tongfuSoftwareQuals } from "@/data/tongfu-software-quals";
import type { TendersFile } from "@/lib/tenders";
import { TenderBoard } from "@/components/TenderBoard";
import tendersData from "@/data/tenders.generated.json";

export const metadata: Metadata = {
  title: "每日标讯",
  description: `${site.name}每日标讯：按贵州通服软件相关资质筛选的软件/信息化招标线索。`,
};

const initial = tendersData as TendersFile;

export default function TendersPage() {
  return (
    <div className="page">
      <p className="page-kicker">Daily Bids · Pipeline C</p>
      <h1 className="page-title">每日标讯</h1>
      <p className="page-desc">
        静态站点 + 定时同步快照：本机/CI 拉取贵州软件类招标并匹配通服相关资质，页面只读结果。
        适合晨会扫一眼：先看分高、再点原文核验。
      </p>

      <TenderBoard initial={initial} />

      <div className="card-quiet card-pad" style={{ marginTop: 28 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>
          通服软件相关资质（摘要）
        </h2>
        <p className="item-body">
          摘自 20240117 贵州通服资质清单，仅保留与软件 / 信息化 / 集成 / 安全 /
          运维相关的条目，用于匹配提示，不构成投标承诺。
        </p>
        <div className="list-stack" style={{ marginTop: 14 }}>
          {tongfuSoftwareQuals.map((q) => (
            <div
              key={q.id}
              className="meta-row"
              style={{ alignItems: "flex-start" }}
            >
              <span className="chip">{q.entity}</span>
              <span style={{ flex: 1 }}>
                <strong style={{ fontWeight: 650 }}>{q.name}</strong>
                <span style={{ opacity: 0.75 }}> — {q.useCase}</span>
              </span>
            </div>
          ))}
        </div>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}
        >
          <Link href="/" className="btn btn-ghost">
            返回首页
          </Link>
          <a
            href="https://dgdata.bxnd.com.cn/login"
            className="btn btn-primary"
            target="_blank"
            rel="noreferrer"
          >
            打开标讯平台
          </a>
        </div>
      </div>
    </div>
  );
}
