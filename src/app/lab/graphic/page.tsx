import type { Metadata } from "next";
import { site } from "@/data/content";
import { GraphicNovelStudio } from "@/components/GraphicNovelStudio";

export const metadata: Metadata = {
  title: "图像小说",
  description: `${site.name}：日记与传记 → 图像小说`,
};

export default function GraphicNovelPage() {
  return (
    <div className="page page-gn">
      <GraphicNovelStudio />
    </div>
  );
}
