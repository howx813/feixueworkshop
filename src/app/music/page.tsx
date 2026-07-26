import type { Metadata } from "next";
import { MusicPlayer } from "@/components/MusicPlayer";
import { site } from "@/data/content";
import { musicConfig } from "@/data/music";

export const metadata: Metadata = {
  title: musicConfig.title,
  description: `${site.name}${musicConfig.title}：${musicConfig.subtitle}`,
};

export default function MusicPage() {
  return (
    <div className="page">
      <p className="page-kicker">Netease Cloud Music</p>
      <h1 className="page-title">{musicConfig.title}</h1>
      <p className="page-desc">{musicConfig.subtitle}</p>
      <MusicPlayer />
    </div>
  );
}
