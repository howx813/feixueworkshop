"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "feixue-theme";

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "light" ? "#f4f5f6" : "#10151c");
  }
}

export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return "dark";
}

type Props = {
  compact?: boolean;
};

export function ThemeSwitch({ compact = false }: Props) {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = getStoredTheme();
    setTheme(initial);
    applyTheme(initial);
    setReady(true);
  }, []);

  const select = (next: ThemeMode) => {
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={compact ? "theme-switch-compact" : "theme-switch"}
      role="group"
      aria-label="外观主题"
      data-ready={ready ? "1" : "0"}
    >
      <button
        type="button"
        className={`theme-switch-btn${theme === "light" ? " active" : ""}`}
        onClick={() => select("light")}
        aria-pressed={theme === "light"}
        title="白天模式"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
        {!compact && <span>白天</span>}
      </button>
      <button
        type="button"
        className={`theme-switch-btn${theme === "dark" ? " active" : ""}`}
        onClick={() => select("dark")}
        aria-pressed={theme === "dark"}
        title="夜晚模式"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z" />
        </svg>
        {!compact && <span>夜晚</span>}
      </button>
    </div>
  );
}

