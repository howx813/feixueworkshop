export type MatchedQual = {
  id: string;
  name: string;
  domain?: string;
  entity?: string;
};

export type DeepAnalysis = {
  analyzedAt?: string;
  summary: string;
  matchedStandards?: string[];
  mustRequirements?: string[];
  mentionedInDoc?: string[];
  gaps?: string[];
  files?: { fileName: string; size?: number; error?: string | null }[];
  hasLocalDocs?: boolean;
};

export type TenderItem = {
  id: string;
  title: string;
  tenderType: string;
  date: string;
  publishTime?: string;
  province: string;
  city: string;
  buyer: string;
  moneyWan: number;
  professions: string[];
  matchedQuals: MatchedQual[];
  score: number;
  /** 1–5，综合匹配星级 */
  stars?: number;
  starScore?: number;
  starReasons?: string[];
  deepAnalysis?: DeepAnalysis;
  sourceUrl: string;
  platformUrl: string;
  stageName?: string;
  purchaseTypeName?: string;
  bidDeadline?: string;
  fileGetDeadline?: string;
  scaleText?: string;
  docFeeRequired?: boolean | null;
  docFeeText?: string;
  bondText?: string;
  qualSection?: string;
  qualHits?: string[];
  /** 专项标签：cta-ai=中电信人工智能科技；telecom-gz=电信贵州/数智 */
  focusTags?: string[];
  /** 中标/成交供应商（公示第一名） */
  winner?: string;
  /** 中标/成交金额（万元） */
  awardMoneyWan?: number;
  /** 候选人列表（若有） */
  candidates?: { rank: number; name: string; moneyWan: number }[];
  /** 公示类型：中标候选人 / 成交候选人 / 询比结果 / 直接采购 等 */
  awardNoticeKind?: string;
};

export type AwardWinnerStat = {
  name: string;
  count: number;
  moneyWan: number;
  projects: string[];
};

export type AwardThemeStat = {
  theme: string;
  count: number;
  moneyWan: number;
};

export type CtaAiAwardAnalysis = {
  total: number;
  uniqueProjects: number;
  withWinner: number;
  withMoney: number;
  totalMoneyWan: number;
  avgMoneyWan: number;
  maxMoneyWan: number;
  kindBreakdown: { kind: string; count: number }[];
  winners: AwardWinnerStat[];
  themes: AwardThemeStat[];
  recent: TenderItem[];
  insights: string[];
};

export type TendersFile = {
  syncedAt: string;
  since: string;
  matchedCount: number;
  softwareCount: number;
  fiveStarCount?: number;
  ctaAiCount?: number;
  telecomGzCount?: number;
  deepAnalyzed?: number;
  authenticated?: boolean;
  note: string;
  items: TenderItem[];
};

export type TenderFocusFilter = "all" | "cta-ai" | "telecom-gz";

export function filterTendersByFocus(
  items: TenderItem[],
  focus: TenderFocusFilter,
): TenderItem[] {
  if (focus === "all") return items;
  return items.filter((i) => (i.focusTags || []).includes(focus));
}

/** 是否中标/结果类公示（相对招采公告） */
export function isAwardNotice(item: TenderItem): boolean {
  const blob = `${item.tenderType || ""}${item.title || ""}${item.awardNoticeKind || ""}`;
  return /中标|候选|成交|结果公示|直接采购公示/.test(blob);
}

function normalizeProjectKey(title: string): string {
  return title
    .replace(/\s+/g, "")
    .replace(/（北京）|\(北京\)/g, "")
    .replace(/中电信人工智能科技有限公司|中电信人工智能科技/g, "")
    .replace(/中标候选人公示|成交候选人公示|询比结果公示|结果公示|直接采购公示/g, "")
    .replace(/（第[一二三四五六七八九十\d]+次）|\(第[一二三四五六七八九十\d]+次\)/g, "")
    .slice(0, 80);
}

function classifyAwardTheme(title: string): string {
  if (/安全测试|渗透测试|供应链安全/.test(title)) return "安全测试";
  if (/数据采购|视频数据|语料|数据集/.test(title)) return "数据采购";
  if (/合规|审计|个保/.test(title)) return "合规审计";
  if (/运维|售后|部署和运维/.test(title)) return "部署运维";
  if (/MAAS|定制化研发|研发服务/.test(title)) return "定制研发";
  if (/标识|外立面|基建|装修|装饰/.test(title)) return "基建配套";
  if (/平台|建设工程|中台|云管/.test(title)) return "平台建设";
  if (/直接采购/.test(title)) return "直接采购";
  return "其他";
}

/**
 * 中电信人工智能科技 · 中标公示分析（去重项目、中标人榜、主题分布、洞察）
 */
export function analyzeCtaAiAwards(items: TenderItem[]): CtaAiAwardAnalysis {
  const awards = items.filter(
    (i) => (i.focusTags || []).includes("cta-ai") && isAwardNotice(i),
  );

  // 同项目去重：保留金额/中标人信息更全的一条
  const byKey = new Map<string, TenderItem>();
  for (const a of awards) {
    const key = normalizeProjectKey(a.title);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, a);
      continue;
    }
    const score = (x: TenderItem) =>
      (x.winner ? 4 : 0) +
      ((x.awardMoneyWan || x.moneyWan || 0) > 0 ? 2 : 0) +
      (x.candidates?.length || 0);
    if (score(a) > score(prev) || (a.date || "") > (prev.date || "")) {
      byKey.set(key, a);
    }
  }
  const unique = Array.from(byKey.values()).sort((a, b) =>
    (b.date || "").localeCompare(a.date || ""),
  );

  const monies = unique.map((u) => u.awardMoneyWan || u.moneyWan || 0);
  const withMoneyList = monies.filter((m) => m > 0);
  const totalMoneyWan = withMoneyList.reduce((s, m) => s + m, 0);
  const withWinner = unique.filter((u) => !!u.winner).length;
  const withMoney = withMoneyList.length;

  const kindMap = new Map<string, number>();
  for (const u of unique) {
    const kind =
      u.awardNoticeKind ||
      ( /中标候选人/.test(u.title)
        ? "中标候选人公示"
        : /成交候选人/.test(u.title)
          ? "成交候选人公示"
          : /直接采购/.test(u.title)
            ? "直接采购公示"
            : /询比|结果公示/.test(u.title)
              ? "询比/结果公示"
              : u.tenderType || "中标");
    kindMap.set(kind, (kindMap.get(kind) || 0) + 1);
  }
  const kindBreakdown = Array.from(kindMap.entries())
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);

  const winnerMap = new Map<string, AwardWinnerStat>();
  for (const u of unique) {
    const name = (u.winner || "").trim();
    if (!name) continue;
    const cur = winnerMap.get(name) || {
      name,
      count: 0,
      moneyWan: 0,
      projects: [] as string[],
    };
    cur.count += 1;
    cur.moneyWan += u.awardMoneyWan || u.moneyWan || 0;
    const short = u.title
      .replace(/中电信人工智能科技\s*（?北京）?\s*有限公司\s*/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 48);
    if (cur.projects.length < 4) cur.projects.push(short);
    winnerMap.set(name, cur);
  }
  const winners = Array.from(winnerMap.values()).sort(
    (a, b) => b.count - a.count || b.moneyWan - a.moneyWan,
  );

  const themeMap = new Map<string, AwardThemeStat>();
  for (const u of unique) {
    const theme = classifyAwardTheme(u.title);
    const cur = themeMap.get(theme) || { theme, count: 0, moneyWan: 0 };
    cur.count += 1;
    cur.moneyWan += u.awardMoneyWan || u.moneyWan || 0;
    themeMap.set(theme, cur);
  }
  const themes = Array.from(themeMap.values()).sort(
    (a, b) => b.count - a.count || b.moneyWan - a.moneyWan,
  );

  const avgMoneyWan =
    withMoney > 0 ? totalMoneyWan / withMoney : 0;
  const maxMoneyWan = withMoneyList.length
    ? Math.max(...withMoneyList)
    : 0;

  const insights: string[] = [];
  if (unique.length === 0) {
    insights.push("当前窗口内暂无中电信人工智能科技相关中标/结果公示。");
  } else {
    insights.push(
      `窗口内中标/结果类公示 ${awards.length} 条，去重项目 ${unique.length} 个` +
        (withMoney
          ? `，有金额 ${withMoney} 个合计约 ${formatTenderMoney(totalMoneyWan)}`
          : "，多数未披露金额"),
    );
    if (winners[0]) {
      const top = winners[0];
      insights.push(
        `中标人频次最高：${top.name}（${top.count} 次` +
          (top.moneyWan > 0 ? `，合计 ${formatTenderMoney(top.moneyWan)}` : "") +
          "）",
      );
    }
    if (themes[0]) {
      insights.push(
        `主题集中在「${themes[0].theme}」等（${themes
          .slice(0, 3)
          .map((t) => `${t.theme}${t.count}`)
          .join("、")}）`,
      );
    }
    const direct = unique.filter((u) => /直接采购/.test(u.title)).length;
    const cand = unique.filter((u) => /候选人/.test(u.title)).length;
    if (direct || cand) {
      insights.push(
        `采购路径：候选人公示 ${cand} · 直接采购/结果公示 ${unique.length - cand}` +
          (direct ? `（含直接采购 ${direct}）` : ""),
      );
    }
    if (withWinner < unique.length) {
      insights.push(
        `${unique.length - withWinner} 个项目未解析到中标人，需点开原文核对`,
      );
    }
  }

  return {
    total: awards.length,
    uniqueProjects: unique.length,
    withWinner,
    withMoney,
    totalMoneyWan: Number(totalMoneyWan.toFixed(4)),
    avgMoneyWan: Number(avgMoneyWan.toFixed(4)),
    maxMoneyWan: Number(maxMoneyWan.toFixed(4)),
    kindBreakdown,
    winners: winners.slice(0, 12),
    themes,
    recent: unique.slice(0, 12),
    insights,
  };
}

export const TENDERS_PUBLIC_PATH = "/data/tenders.json";

export function formatTenderMoney(wan: number) {
  if (!wan || wan <= 0) return "金额未披露";
  if (wan >= 10000) return `${(wan / 10000).toFixed(2)} 亿元`;
  return `${wan.toFixed(wan >= 100 ? 0 : 2)} 万元`;
}

export function formatDocFee(item: TenderItem) {
  if (item.docFeeText) return item.docFeeText;
  if (item.docFeeRequired === false) return "不收取文件费用";
  if (item.docFeeRequired === true) return "需购买文件（见原文）";
  return "原文未写明";
}

export function formatStars(stars = 0) {
  const n = Math.max(0, Math.min(5, Math.round(stars)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function tenderScoreClass(score: number) {
  if (score >= 70) return "score-high";
  if (score >= 45) return "score-mid";
  return "";
}

export function starClass(stars = 0) {
  if (stars >= 5) return "star-5";
  if (stars >= 4) return "star-4";
  if (stars >= 3) return "star-3";
  return "star-low";
}

export async function fetchTendersPublic(
  signal?: AbortSignal,
): Promise<TendersFile> {
  const res = await fetch(TENDERS_PUBLIC_PATH, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`标讯快照不可用 (${res.status})`);
  }
  return (await res.json()) as TendersFile;
}
