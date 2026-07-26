"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  favoriteTracks,
  musicConfig,
  outchainSongUrl,
  songPageUrl,
  type MusicTrack,
} from "@/data/music";

function pickRandom(list: MusicTrack[], excludeId?: number): MusicTrack {
  if (list.length === 0) {
    return { id: 0, name: "暂无曲目", artist: "—" };
  }
  if (list.length === 1) return list[0];
  let next = list[Math.floor(Math.random() * list.length)];
  let guard = 0;
  while (excludeId != null && next.id === excludeId && guard < 8) {
    next = list[Math.floor(Math.random() * list.length)];
    guard += 1;
  }
  return next;
}

type Generated = {
  tracks?: MusicTrack[];
  playlistName?: string;
  trackCount?: number;
};

export function MusicPlayer() {
  const [tracks, setTracks] = useState<MusicTrack[]>(favoriteTracks);
  const [sourceNote, setSourceNote] = useState(musicConfig.sourceLabel);
  const [current, setCurrent] = useState<MusicTrack | null>(null);
  const [auto, setAuto] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = (await import("@/data/music-songs.generated.json")) as {
          default: Generated;
        };
        const gen = mod.default;
        if (!cancelled && Array.isArray(gen?.tracks) && gen.tracks.length > 0) {
          setTracks(gen.tracks);
          setSourceNote(
            gen.playlistName
              ? `网易云 · ${gen.playlistName}`
              : musicConfig.sourceLabel,
          );
        }
      } catch {
        /* use defaults */
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
  }, [ready, tracks]);

  const next = useCallback(() => {
    setCurrent((prev) => pickRandom(tracks, prev?.id));
    setAuto(true);
  }, [tracks]);

  const playerSrc = useMemo(() => {
    if (!current?.id) return "";
    return outchainSongUrl(current.id, auto);
  }, [current, auto]);

  if (!ready || !current) {
    return (
      <div className="card card-pad">
        <div className="item-body">正在准备曲库…</div>
      </div>
    );
  }

  return (
    <div className="list-stack">
      <div className="day-bar">
        <strong>随机播放中</strong>
        <span>
          {sourceNote} · 共 {tracks.length} 首
        </span>
      </div>

      <article className="card card-pad music-now">
        <div className="meta-row">
          <span className="chip chip-accent">Now Playing</span>
          <span className="score-pill">#{current.id}</span>
        </div>
        <h2 className="item-title" style={{ fontSize: "1.25rem" }}>
          {current.name}
        </h2>
        <p className="item-body" style={{ marginTop: 6 }}>
          {current.artist}
          {current.album ? ` · ${current.album}` : ""}
        </p>

        <div className="music-player-frame">
          {playerSrc ? (
            <iframe
              key={playerSrc}
              title={`${current.name} - 网易云播放器`}
              src={playerSrc}
              frameBorder={0}
              allow="autoplay; encrypted-media"
              scrolling="no"
            />
          ) : null}
        </div>

        <div className="music-actions">
          <button type="button" className="btn btn-primary" onClick={next}>
            换一首
          </button>
          <a
            className="btn btn-ghost"
            href={songPageUrl(current.id)}
            target="_blank"
            rel="noreferrer"
          >
            在网易云打开
          </a>
        </div>

        <p className="music-hint">
          浏览器可能拦截自动播放：若未出声，点播放器内播放键，或点「换一首」。
        </p>
      </article>

      <section className="section" style={{ marginTop: 8 }}>
        <div className="section-head">
          <h2 className="section-title">曲库速览</h2>
          <span className="section-meta">点击即播</span>
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
                  setCurrent(t);
                  setAuto(true);
                }}
              >
                <div className="meta-row">
                  {active ? (
                    <span className="chip chip-accent">播放中</span>
                  ) : (
                    <span className="chip">曲目</span>
                  )}
                  <span className="score-pill">{t.id}</span>
                </div>
                <div className="item-title" style={{ fontSize: "0.9375rem" }}>
                  {t.name}
                </div>
                <div className="item-body">{t.artist}</div>
              </button>
            );
          })}
        </div>
        {tracks.length > 12 ? (
          <p className="item-body" style={{ marginTop: 10 }}>
            仅展示前 12 首；「换一首」会从全部 {tracks.length} 首中随机。
          </p>
        ) : null}
      </section>
    </div>
  );
}
