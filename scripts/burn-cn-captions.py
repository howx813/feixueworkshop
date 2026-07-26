#!/usr/bin/env python3
"""把成片页烧录中文页名与旁白（精确汉字用代码叠字，不用模型）。"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
TS = ROOT / "src/data/graphic-novels.ts"
FONT = "/System/Library/Fonts/STHeiti Medium.ttc"
# 封面页不覆盖画面（已是中文书名/原书封面）
SKIP_COVER_IDS = {"jobs-01", "musk-01", "diary-01"}


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    try:
        return ImageFont.truetype(FONT, size=size, index=0)
    except OSError:
        return ImageFont.load_default()


def wrap_text(text: str, font: ImageFont.ImageFont, max_w: int, draw: ImageDraw.ImageDraw) -> list[str]:
    lines: list[str] = []
    cur = ""
    for ch in text:
        trial = cur + ch
        w = draw.textbbox((0, 0), trial, font=font)[2]
        if w <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines or [""]


def parse_beats(ts_text: str) -> dict[str, list[dict]]:
    """从 graphic-novels.ts 解析 jobsBeats / muskBeats / diaryBeats。"""
    out: dict[str, list[dict]] = {}
    for name in ("jobsBeats", "muskBeats", "diaryBeats"):
        m = re.search(
            rf"export const {name}[^=]*=\s*\[(.*?)\];\s*\n\s*(?:/\*\*|export const)",
            ts_text,
            re.S,
        )
        if not m:
            # last array before export const jobsNovel
            m = re.search(rf"export const {name}[^=]*=\s*\[(.*?)\]\s*;", ts_text, re.S)
        if not m:
            print(f"warn: cannot parse {name}", file=sys.stderr)
            continue
        body = m.group(1)
        items = []
        for block in re.finditer(
            r"\{\s*id:\s*\"([^\"]+)\"\s*,\s*page:\s*(\d+)\s*,\s*title:\s*\"([^\"]*)\"\s*,\s*caption:\s*\"([^\"]*)\"",
            body,
        ):
            items.append(
                {
                    "id": block.group(1),
                    "page": int(block.group(2)),
                    "title": block.group(3),
                    "caption": block.group(4),
                }
            )
        out[name] = items
        print(f"parsed {name}: {len(items)} pages")
    return out


def folder_for(name: str) -> str:
    return {
        "jobsBeats": "jobs",
        "muskBeats": "musk",
        "diaryBeats": "diary-sample",
    }[name]


def strip_prior_bars(im: Image.Image) -> Image.Image:
    """若已烧过顶底中文条，先裁掉再重烧，避免叠多层。"""
    w, h = im.size
    px = im.load()
    # 顶条：近黑
    top_dark = 0
    for y in range(min(h, int(h * 0.12))):
        r, g, b = px[w // 2, y][:3]
        if r < 50 and g < 50 and b < 50:
            top_dark = y + 1
        else:
            break
    # 底条：近黑
    bot_dark = h
    for y in range(h - 1, max(0, h - int(h * 0.35)), -1):
        r, g, b = px[w // 2, y][:3]
        if r < 50 and g < 50 and b < 50:
            bot_dark = y
        else:
            break
    top_c = top_dark if top_dark > 20 else 0
    bot_c = bot_dark if (h - bot_dark) > 40 else h
    if top_c or bot_c < h:
        return im.crop((0, top_c, w, bot_c))
    return im


def burn_page(path: Path, title: str, caption: str, page_no: int, total: int) -> None:
    im = strip_prior_bars(Image.open(path).convert("RGB"))
    w, h = im.size
    # 底部中文旁白带
    bar_h = max(72, int(h * 0.18))
    out = Image.new("RGB", (w, h + bar_h), (245, 243, 238))
    out.paste(im, (0, 0))
    draw = ImageDraw.Draw(out)

    # 顶条页码（中文）
    top_h = max(28, int(h * 0.055))
    draw.rectangle([0, 0, w, top_h], fill=(28, 28, 28))
    font_top = load_font(max(14, w // 28))
    top = f"第 {page_no} 页 / 共 {total} 页"
    bbox = draw.textbbox((0, 0), top, font=font_top)
    tw = bbox[2] - bbox[0]
    draw.text(((w - tw) // 2, (top_h - (bbox[3] - bbox[1])) // 2), top, fill=(240, 240, 240), font=font_top)

    # 底栏
    y0 = h
    draw.rectangle([0, y0, w, h + bar_h], fill=(32, 32, 32))
    pad = max(10, w // 30)
    font_title = load_font(max(16, w // 18))
    font_cap = load_font(max(13, w // 24))

    draw.text((pad, y0 + pad // 2), title, fill=(255, 220, 140), font=font_title)
    title_h = draw.textbbox((0, 0), title, font=font_title)[3]

    max_w = w - pad * 2
    lines = wrap_text(caption, font_cap, max_w, draw)
    y = y0 + pad // 2 + title_h + 6
    for line in lines[:4]:
        draw.text((pad, y), line, fill=(230, 230, 230), font=font_cap)
        y += draw.textbbox((0, 0), line, font=font_cap)[3] + 4

    out.save(path, quality=92, optimize=True)


def main() -> None:
    ts = TS.read_text(encoding="utf-8")
    beats = parse_beats(ts)
    for name, items in beats.items():
        folder = ROOT / "public/graphic" / folder_for(name)
        total = len(items)
        for it in items:
            path = folder / f"{it['page']:02d}.jpg"
            if not path.exists():
                print("missing", path)
                continue
            if it["id"] in SKIP_COVER_IDS:
                print("skip cover", path.name)
                continue
            burn_page(path, it["title"], it["caption"], it["page"], total)
            print("burned", folder.name, path.name, it["title"])


if __name__ == "__main__":
    main()
