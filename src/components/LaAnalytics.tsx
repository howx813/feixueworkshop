"use client";

import { useEffect } from "react";
import { analytics } from "@/data/analytics";

const SDK_URL = "https://sdk.51.la/js-sdk-pro.min.js";

declare global {
  interface Window {
    LA?: {
      init: (opts: { id: string; ck: string; autoTrack?: boolean }) => void;
    };
  }
}

/**
 * 51.la 统计（V6 异步模式）。
 * 未在 src/data/analytics.ts 配置 id/ck 时完全静默：不加载任何脚本、
 * 不发起任何请求。autoTrack 让 App Router 的前端路由切换也计入 PV。
 */
export function LaAnalytics() {
  useEffect(() => {
    if (!analytics.laId || !analytics.laCk) return;
    if (document.getElementById("LA_COLLECT")) return;
    const s = document.createElement("script");
    s.id = "LA_COLLECT";
    s.charset = "UTF-8";
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => {
      window.LA?.init({
        id: analytics.laId,
        ck: analytics.laCk,
        autoTrack: true,
      });
    };
    document.head.appendChild(s);
  }, []);
  return null;
}
