"use client";

import { useEffect, useRef, useState } from "react";
import {
  graphicCatalog,
  novelsById,
  type GraphicNovel,
} from "@/data/graphic-novels";
import {
  checkGraphicServer,
  startBookGenerate,
  waitGenerateJob,
} from "@/lib/graphic-api";

type Phase = "idle" | "opening" | "generating" | "reading";

const SHORT_NAMES: Record<string, string> = {
  jobs: "史蒂夫·乔布斯传",
  musk: "埃隆·马斯克传",
  welch: "赢",
  luoyonghao: "我的奋斗",
  kaifu: "世界因你不同",
  guojing: "射雕英雄传",
};

/** 首页展示用实体书封面（各成片第 1 页） */
const COVER_SRC: Record<string, string> = {
  jobs: "/graphic/jobs/01.jpg",
  musk: "/graphic/musk/01.jpg",
  welch: "/graphic/welch/01.jpg",
  luoyonghao: "/graphic/luoyonghao/01.jpg",
  kaifu: "/graphic/kaifu/01.jpg",
  guojing: "/graphic/guojing/01.jpg",
};

export function GraphicNovelStudio() {
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [novel, setNovel] = useState<GraphicNovel | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState("");
  const [genProgress, setGenProgress] = useState(0);
  const [genMessage, setGenMessage] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const current = novel?.pages?.[pageIndex];
  const total = novel?.pages?.length ?? 0;

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function openCatalog(hit: GraphicNovel) {
    setError("");
    setPhase("opening");
    setPageIndex(0);
    await new Promise((r) => setTimeout(r, 120));
    setNovel(hit);
    setPhase("reading");
  }

  async function onSearch() {
    const q = search.trim();
    if (!q) {
      setError("输入书名或人物");
      searchRef.current?.focus();
      return;
    }

    setError("");
    setPhase("generating");
    setPageIndex(0);
    setGenProgress(5);
    setGenMessage("解析书目…");
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const ok = await checkGraphicServer();
    if (!ok) {
      setPhase("idle");
      setError("生成服务未启动 · npm run pay:server");
      return;
    }

    try {
      const job = await startBookGenerate(q);
      setGenProgress(Math.max(8, job.progress || 8));
      setGenMessage(job.message || "生成中…");

      const final = await waitGenerateJob(job.id, {
        intervalMs: 1000,
        signal: abortRef.current.signal,
        onTick: (j) => {
          setGenProgress(j.progress || 0);
          setGenMessage(j.message || "");
        },
      });

      if (final.status === "error" || !final.novel?.pages?.length) {
        throw new Error(final.error || final.message || "生成失败");
      }

      setNovel(final.novel);
      setPhase("reading");
    } catch (e) {
      if (e instanceof Error && e.message === "已取消") return;
      setNovel(null);
      setPhase("idle");
      setError(e instanceof Error ? e.message : "生成失败");
    }
  }

  function nextPage() {
    if (!novel) return;
    if (pageIndex + 1 >= total) return;
    setPageIndex((i) => i + 1);
  }

  function prevPage() {
    if (pageIndex > 0) setPageIndex((i) => i - 1);
  }

  function backToSearch() {
    abortRef.current?.abort();
    setPhase("idle");
    setNovel(null);
    setPageIndex(0);
    setError("");
    setGenProgress(0);
    setGenMessage("");
  }

  if (phase === "idle" || phase === "opening" || phase === "generating") {
    return (
      <div className="gn-studio gn-minimal">
        <ul className="gn-covers" aria-label="成片书目">
          {graphicCatalog.map((c) => {
            const short = SHORT_NAMES[c.id] || c.title;
            const cover = COVER_SRC[c.id];
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className="gn-cover-card"
                  disabled={phase === "opening" || phase === "generating"}
                  onClick={() => {
                    const hit = novelsById[c.id];
                    if (hit?.pages?.length) void openCatalog(hit);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover}
                    alt={short}
                    className="gn-cover-img"
                    loading="lazy"
                  />
                  <span className="gn-cover-name">{short}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <form
          className="gn-search"
          onSubmit={(e) => {
            e.preventDefault();
            if (phase === "idle") void onSearch();
          }}
        >
          <input
            ref={searchRef}
            className="gn-hero-input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (error) setError("");
            }}
            placeholder="搜索书名或人物，如：松下幸之助 / 郭靖 / 西游记"
            disabled={phase === "generating" || phase === "opening"}
            autoComplete="off"
          />
          {phase === "generating" ? (
            <div className="gn-hero-progress" aria-hidden>
              <div
                className="gn-hero-progress-bar"
                style={{ width: `${Math.min(100, Math.max(6, genProgress))}%` }}
              />
            </div>
          ) : (
            <button
              type="submit"
              className="gn-hero-go"
              disabled={!search.trim() || phase === "opening"}
            >
              生成五页
            </button>
          )}
          {phase === "generating" ? (
            <p className="gn-gen-hint">{genMessage || "生成中…"}</p>
          ) : null}
          {error ? <p className="gn-hero-error">{error}</p> : null}
        </form>
      </div>
    );
  }

  if (phase === "reading" && novel && current) {
    const last = pageIndex + 1 >= total;
    return (
      <div className="gn-studio gn-minimal gn-read">
        <div className="gn-read-top">
          <button type="button" className="gn-text-btn" onClick={backToSearch}>
            ←
          </button>
          <span className="gn-read-count">
            {pageIndex + 1} / {total}
          </span>
          <span className="gn-read-title">{novel.title}</span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.image} alt="" className="gn-page-img gn-page-img-focus" />

        {current.caption ? (
          <p className="gn-caption gn-caption-soft">{current.caption}</p>
        ) : null}

        <div className="gn-nav gn-nav-min">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={prevPage}
            disabled={pageIndex === 0}
          >
            上页
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={nextPage}
            disabled={last}
          >
            {last ? "完" : "下页"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
