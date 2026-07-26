/**
 * AI HOT Public API
 * https://aihot.virxact.com/openapi-v1.json
 * CORS: * · 无需 key · mode=selected 即「精选」
 */

export const AIHOT_ORIGIN = "https://aihot.virxact.com";
export const AIHOT_ITEMS_URL = `${AIHOT_ORIGIN}/api/v1/items`;

export type AihotSource = { name: string };
export type AihotLinks = { aihot: string; original: string };

export type AihotItem = {
  id: string;
  title: string;
  originalTitle?: string;
  summary: string;
  source?: AihotSource;
  links: AihotLinks;
  publishedAt: string;
  discoveredAt?: string;
  category?: string;
  score?: number;
  selected?: boolean;
};

export type AihotItemsResponse = {
  schemaVersion: number;
  query: {
    mode: string;
    window: string;
  };
  items: AihotItem[];
};

const CATEGORY_LABEL: Record<string, string> = {
  "ai-models": "模型",
  "ai-products": "产品",
  industry: "行业",
  paper: "论文",
  tip: "技巧观点",
};

export function categoryLabel(cat?: string) {
  if (!cat) return "动态";
  return CATEGORY_LABEL[cat] || cat;
}

export function formatAihotTime(iso: string) {
  try {
    const d = new Date(iso);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${m}月${day}日 ${hh}:${mm}`;
  } catch {
    return iso.slice(0, 10);
  }
}

export type FetchAihotOptions = {
  mode?: "selected" | "all";
  window?: "24h" | "7d";
  limit?: number;
  signal?: AbortSignal;
  /** 超时 ms，默认 10000 */
  timeoutMs?: number;
};

function mergeSignals(
  user: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new Error("timeout")), timeoutMs);

  const onUserAbort = () => ctrl.abort(user?.reason ?? new Error("aborted"));
  if (user) {
    if (user.aborted) onUserAbort();
    else user.addEventListener("abort", onUserAbort, { once: true });
  }

  return {
    signal: ctrl.signal,
    cleanup: () => {
      clearTimeout(timer);
      if (user) user.removeEventListener("abort", onUserAbort);
    },
  };
}

export async function fetchAihotSelected(
  options: FetchAihotOptions = {},
): Promise<AihotItem[]> {
  const mode = options.mode ?? "selected";
  const window = options.window ?? "7d";
  const limit = options.limit ?? 10;
  const timeoutMs = options.timeoutMs ?? 10000;
  const url = new URL(AIHOT_ITEMS_URL);
  url.searchParams.set("mode", mode);
  url.searchParams.set("window", window);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("by", "timeline");

  const { signal, cleanup } = mergeSignals(options.signal, timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      signal,
      headers: { Accept: "application/json" },
      // 构建期 / 客户端都不走 Next 默认强制缓存误判
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`AI HOT HTTP ${res.status}`);
    }
    const data = (await res.json()) as AihotItemsResponse;
    return Array.isArray(data.items) ? data.items : [];
  } finally {
    cleanup();
  }
}
