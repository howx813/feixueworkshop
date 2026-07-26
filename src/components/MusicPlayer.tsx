"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  favoriteTracks,
  metingUrl,
  musicConfig,
  songPageUrl,
  type MusicTrack,
} from "@/data/music";

function pickRandom(list: MusicTrack[], excludeId?: number): MusicTrack {
  if (list.length === 0) {
    return {
      id: 0,
      name: "暂无曲目",
      artist: "—",
      access: "vip",
    };
  }
  const free = list.filter((t) => t.access === "free");
  const pool = free.length > 0 ? free : list;
  if (pool.length === 1) return pool[0];
  let next = pool[Math.floor(Math.random() * pool.length)];
  let guard = 0;
  while (excludeId != null && next.id === excludeId && guard < 10) {
    next = pool[Math.floor(Math.random() * pool.length)];
    guard += 1;
  }
  return next;
}

type Generated = {
  tracks?: Array<Partial<MusicTrack> & { id: number; name: string; artist: string }>;
  playlistName?: string;
};

type Status = "idle" | "loading" | "playing" | "paused" | "error" | "vip";

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>(favoriteTracks);
  const [sourceNote, setSourceNote] = useState(musicConfig.sourceLabel);
  const [current, setCurrent] = useState<MusicTrack | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = (await import("@/data/music-songs.generated.json")) as {
          default: Generated;
        };
        const gen = mod.default;
        if (!cancelled && Array.isArray(gen?.tracks) && gen.tracks.length > 0) {
          // 同步歌单默认按 vip 处理，避免错误预期；可在 music.ts 手改 access
          const mapped: MusicTrack[] = gen.tracks.map((t) => ({
            id: t.id,
            name: t.name,
            artist: t.artist,
            album: t.album,
            cover: t.cover,
            access: t.access === "free" ? "free" : "vip",
          }));
          setTracks(mapped);
          setSourceNote(
            gen.playlistName
              ? `网易云 · ${gen.playlistName}`
              : musicConfig.sourceLabel,
          );
        }
      } catch {
        /* defaults */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    setCurrent(pickRandom(tracks));
    setStatus("idle");
    setMessage("");
    setProgress(0);
    setDuration(0);
  }, [ready, tracks]);

  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.removeAttribute("src");
    a.load();
  }, []);

  const playTrack = useCallback(
    async (track: MusicTrack) => {
      setCurrent(track);
      setProgress(0);
      setDuration(0);
      setMessage("");

      if (track.access === "vip") {
        stopAudio();
        setStatus("vip");
        setMessage(
          "该曲有版权限制，第三方站点无法直接播放。请点「在网易云打开」登录后收听。",
        );
        return;
      }

      setStatus("loading");
      stopAudio();

      const audio = audioRef.current;
      if (!audio) {
        setStatus("error");
        setMessage("播放器未就绪，请刷新页面重试。");
        return;
      }

      // 用 meting 代理取可试听直链（URL 会过期，每次播放现取）
      const src = metingUrl(track.id);
      try {
        audio.crossOrigin = "anonymous";
        audio.src = src;
        audio.load();
        await audio.play();
        setStatus("playing");
        setMessage("正在播放（可试听源）");
      } catch {
        setStatus("error");
        setMessage(
          "自动播放被拦截或音源暂不可用。可再点「播放」，或去网易云打开。",
        );
      }
    },
    [stopAudio],
  );

  const onPlayClick = useCallback(() => {
    if (!current) return;
    void playTrack(current);
  }, [current, playTrack]);

  const onPauseToggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current || current.access === "vip") return;
    if (a.paused) {
      void a.play().then(() => setStatus("playing")).catch(() => {
        setStatus("error");
        setMessage("继续播放失败，请重试或去网易云打开。");
      });
    } else {
      a.pause();
      setStatus("paused");
    }
  }, [current]);

  const next = useCallback(() => {
    const n = pickRandom(tracks, current?.id);
    void playTrack(n);
  }, [tracks, current, playTrack]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onTime = () => {
      setProgress(a.currentTime || 0);
      setDuration(a.duration || 0);
    };
    const onEnded = () => {
      setStatus("idle");
      setMessage("本首结束，可点「换一首」");
    };
    const onErr = () => {
      setStatus("error");
      setMessage("音源加载失败（可能版权或代理波动）。请换一首或去网易云。");
    };

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onTime);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onErr);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onTime);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onErr);
    };
  }, []);

  const fmt = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (!ready || !current) {
    return (
      <div className="card card-pad">
        <div className="item-body">正在准备曲库…</div>
      </div>
    );
  }

  const isVip = current.access === "vip";
  const isPlaying = status === "playing";

  return (
    <div className="list-stack">
      <audio ref={audioRef} preload="none" playsInline />

      <div className="day-bar">
        <strong>{isPlaying ? "播放中" : "工坊电台"}</strong>
        <span>
          {sourceNote} · 共 {tracks.length} 首 · 可试听{" "}
          {tracks.filter((t) => t.access === "free").length} 首
        </span>
      </div>

      <article className="card card-pad music-now">
        <div className="meta-row">
          <span className="chip chip-accent">Now Playing</span>
          <span className={`chip ${isVip ? "chip-rose" : "chip-amber"}`}>
            {isVip ? "版权曲" : "可试听"}
          </span>
          <span className="score-pill">#{current.id}</span>
        </div>
        <h2 className="item-title" style={{ fontSize: "1.25rem" }}>
          {current.name}
        </h2>
        <p className="item-body" style={{ marginTop: 6 }}>
          {current.artist}
          {current.album ? ` · ${current.album}` : ""}
        </p>

        <div className="music-progress">
          <div className="music-progress-bar">
            <div
              className="music-progress-fill"
              style={{
                width:
                  duration > 0
                    ? `${Math.min(100, (progress / duration) * 100)}%`
                    : "0%",
              }}
            />
          </div>
          <div className="music-progress-time">
            <span>{fmt(progress)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        <div className="music-actions">
          {isVip ? (
            <a
              className="btn btn-primary"
              href={songPageUrl(current.id)}
              target="_blank"
              rel="noreferrer"
            >
              在网易云打开
            </a>
          ) : status === "playing" || status === "paused" ? (
            <button type="button" className="btn btn-primary" onClick={onPauseToggle}>
              {isPlaying ? "暂停" : "继续"}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onPlayClick}
              disabled={status === "loading"}
            >
              {status === "loading" ? "加载中…" : "播放"}
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={next}>
            换一首
          </button>
          <a
            className="btn btn-ghost"
            href={songPageUrl(current.id)}
            target="_blank"
            rel="noreferrer"
          >
            网易云
          </a>
        </div>

        {(message || status === "vip") && (
          <p className={`music-hint ${status === "error" || status === "vip" ? "is-warn" : ""}`}>
            {message ||
              (status === "vip"
                ? "版权曲无法在本站直连播放，请使用网易云官方客户端/网页。"
                : "")}
          </p>
        )}
        {!message && status === "idle" && !isVip && (
          <p className="music-hint">
            点「播放」开始（浏览器需用户手势才能出声）。可试听曲本站直连；版权曲请去网易云。
          </p>
        )}
      </article>

      <section className="section" style={{ marginTop: 8 }}>
        <div className="section-head">
          <h2 className="section-title">曲库速览</h2>
          <span className="section-meta">点击切换</span>
        </div>
        <div className="list-stack">
          {tracks.slice(0, 12).map((t) => {
            const active = t.id === current.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`card card-pad music-track${active ? " is-active" : ""}`}
                onClick={() => {
                  void playTrack(t);
                }}
              >
                <div className="meta-row">
                  {active ? (
                    <span className="chip chip-accent">当前</span>
                  ) : (
                    <span className="chip">曲目</span>
                  )}
                  <span
                    className={`chip ${t.access === "vip" ? "chip-rose" : "chip-amber"}`}
                  >
                    {t.access === "vip" ? "版权" : "可听"}
                  </span>
                </div>
                <div className="item-title" style={{ fontSize: "0.9375rem" }}>
                  {t.name}
                </div>
                <div className="item-body">{t.artist}</div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
