#!/usr/bin/env python3
"""
Jobs graphic novel pages in Alan's War (Guibert) sense:
- Comic panel grid (not magazine illustration + essay)
- Long narration lives INSIDE white caption boxes inside panels
- Soft gray art shares the panel with text
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SESS = Path.home() / ".grok/sessions/%2FUsers%2Fxuhao/019f9d11-0232-75c3-a12e-3477eba1d961/images"
OUT = ROOT / "public/graphic/jobs"
PAPER = (245, 241, 232)
INK = (28, 28, 28)
PANEL_EDGE = (55, 55, 55)
BOX_FILL = (255, 255, 252)
BOX_EDGE = (40, 40, 40)
W, H = 900, 1350
M = 28
GUTTER = 12

ART = {
    "hospital": SESS / "437.jpg",
    "adopt": SESS / "439.jpg",
    "valley": SESS / "438.jpg",
    "two": SESS / "441.jpg",
    "calli": SESS / "440.jpg",
    "garage": SESS / "445.jpg",
    "pc": SESS / "444.jpg",
    "mac": SESS / "443.jpg",
    "fired": SESS / "446.jpg",
    "stanford": SESS / "442.jpg",
}

FONT_PATHS = [
    "/System/Library/Fonts/STSong.ttc",
    "/System/Library/Fonts/Supplemental/Songti.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/Library/Fonts/Arial Unicode.ttf",
]


def font(size: int) -> ImageFont.FreeTypeFont:
    for p in FONT_PATHS:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size=size, index=0)
            except OSError:
                pass
    return ImageFont.load_default()


def wash(path: Path, size: tuple[int, int]) -> Image.Image:
    im = Image.open(path).convert("RGB")
    im = ImageOps.grayscale(im).convert("RGB")
    # slight paper blend
    im = Image.blend(im, Image.new("RGB", im.size, PAPER), 0.12)
    im = im.resize(size, Image.Resampling.LANCZOS)
    # soft vignette edge like ink wash comic
    return im.filter(ImageFilter.SMOOTH_MORE)


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont, max_w: int) -> list[str]:
    lines: list[str] = []
    for para in text.replace("\r", "").split("\n"):
        if not para:
            lines.append("")
            continue
        buf = ""
        for ch in para:
            t = buf + ch
            if draw.textlength(t, font=fnt) <= max_w:
                buf = t
            else:
                if buf:
                    lines.append(buf)
                buf = ch
        if buf:
            lines.append(buf)
    return lines


def draw_panel(page: Image.Image, box: tuple[int, int, int, int], art: Image.Image | None) -> None:
    x0, y0, x1, y1 = box
    draw = ImageDraw.Draw(page)
    draw.rectangle([x0, y0, x1, y1], outline=PANEL_EDGE, width=2)
    if art is not None:
        inner = (x0 + 2, y0 + 2, x1 - 2, y1 - 2)
        w, h = inner[2] - inner[0], inner[3] - inner[1]
        a = art.copy()
        # cover panel, center-crop feel
        aw, ah = a.size
        scale = max(w / aw, h / ah)
        nw, nh = int(aw * scale), int(ah * scale)
        a = a.resize((nw, nh), Image.Resampling.LANCZOS)
        cx, cy = (nw - w) // 2, (nh - h) // 2
        a = a.crop((cx, cy, cx + w, cy + h))
        page.paste(a, (inner[0], inner[1]))


def caption_box(
    page: Image.Image,
    box: tuple[int, int, int, int],
    text: str,
    fsize: int = 17,
) -> None:
    """White narration box INSIDE a panel — Guibert sense."""
    x0, y0, x1, y1 = box
    draw = ImageDraw.Draw(page)
    # slightly soft rectangle
    draw.rectangle([x0, y0, x1, y1], fill=BOX_FILL, outline=BOX_EDGE, width=1)
    fnt = font(fsize)
    pad = 8
    max_w = x1 - x0 - 2 * pad
    lines = wrap(draw, text, fnt, max_w)
    lh = fsize + 6
    y = y0 + pad
    for line in lines:
        if y + lh > y1 - pad:
            break
        if line:
            draw.text((x0 + pad, y), line, font=fnt, fill=INK)
        y += lh


def page_base() -> Image.Image:
    return Image.new("RGB", (W, H), PAPER)


def compose_layout_A(
    arts: list[Path],
    texts: list[str],
    out: Path,
) -> None:
    """
    Like style sample:
    top row 2 panels (art+caption overlays)
    mid wide panel
    bottom 3 small
    """
    page = page_base()
    # top two
    tw = (W - 2 * M - GUTTER) // 2
    th = 340
    p1 = (M, M, M + tw, M + th)
    p2 = (M + tw + GUTTER, M, W - M, M + th)
    draw_panel(page, p1, wash(arts[0], (tw, th)))
    draw_panel(page, p2, wash(arts[1], (tw, th)))
    # caption on lower part of each top panel
    caption_box(page, (p1[0] + 8, p1[3] - 118, p1[2] - 8, p1[3] - 8), texts[0], 16)
    caption_box(page, (p2[0] + 8, p2[1] + 8, p2[2] - 8, p2[1] + 130), texts[1], 16)

    # mid wide
    my0 = M + th + GUTTER
    mh = 420
    pm = (M, my0, W - M, my0 + mh)
    draw_panel(page, pm, wash(arts[2], (W - 2 * M, mh)))
    caption_box(page, (pm[2] - 300, pm[1] + 12, pm[2] - 12, pm[1] + 200), texts[2], 16)

    # bottom three
    by0 = my0 + mh + GUTTER
    bh = H - M - by0
    bw = (W - 2 * M - 2 * GUTTER) // 3
    for i in range(3):
        x0 = M + i * (bw + GUTTER)
        pb = (x0, by0, x0 + bw, by0 + bh)
        art = wash(arts[min(3 + i, len(arts) - 1)], (bw, bh))
        draw_panel(page, pb, art)
        if i == 0:
            caption_box(page, (pb[0] + 6, pb[3] - 100, pb[2] - 6, pb[3] - 6), texts[3], 15)
        elif i == 2:
            caption_box(page, (pb[0] + 6, pb[1] + 6, pb[2] - 6, pb[1] + 110), texts[4], 15)

    page.save(out, "JPEG", quality=93, optimize=True)
    print("A", out.name)


def compose_layout_B(arts: list[Path], texts: list[str], out: Path) -> None:
    """Stacked: top half art+side caption, bottom half art+bottom caption strip."""
    page = page_base()
    # top
    th = 620
    pt = (M, M, W - M, M + th)
    draw_panel(page, pt, wash(arts[0], (W - 2 * M, th)))
    # left vertical caption box
    caption_box(page, (M + 10, M + 14, M + 280, M + th - 14), texts[0] + "\n\n" + texts[1], 16)
    # bottom
    by0 = M + th + GUTTER
    pb = (M, by0, W - M, H - M)
    draw_panel(page, pb, wash(arts[1], (W - 2 * M, H - M - by0)))
    caption_box(page, (M + 12, H - M - 130, W - M - 12, H - M - 12), texts[2], 17)
    page.save(out, "JPEG", quality=93, optimize=True)
    print("B", out.name)


def compose_layout_C(arts: list[Path], texts: list[str], out: Path) -> None:
    """
    Three horizontal tiers:
    1) full width art with caption bottom-left
    2) two columns: caption | art
    3) full width art with caption top
    """
    page = page_base()
    h1, h2, h3 = 380, 420, H - 2 * M - 2 * GUTTER - 380 - 420
    # tier1
    p1 = (M, M, W - M, M + h1)
    draw_panel(page, p1, wash(arts[0], (W - 2 * M, h1)))
    caption_box(page, (M + 10, M + h1 - 140, M + 420, M + h1 - 10), texts[0], 16)
    # tier2
    y2 = M + h1 + GUTTER
    left_w = 320
    p2a = (M, y2, M + left_w, y2 + h2)
    p2b = (M + left_w + GUTTER, y2, W - M, y2 + h2)
    # left is pure caption panel (text as image)
    draw_panel(page, p2a, None)
    ImageDraw.Draw(page).rectangle([p2a[0] + 2, p2a[1] + 2, p2a[2] - 2, p2a[3] - 2], fill=BOX_FILL)
    caption_box(page, (p2a[0] + 6, p2a[1] + 6, p2a[2] - 6, p2a[3] - 6), texts[1], 16)
    draw_panel(page, p2b, wash(arts[1], (W - M - (M + left_w + GUTTER), h2)))
    # tier3
    y3 = y2 + h2 + GUTTER
    p3 = (M, y3, W - M, H - M)
    draw_panel(page, p3, wash(arts[2], (W - 2 * M, H - M - y3)))
    caption_box(page, (M + 12, y3 + 10, W - M - 12, y3 + 120), texts[2], 16)
    page.save(out, "JPEG", quality=93, optimize=True)
    print("C", out.name)


PAGES = [
    dict(
        file="02.jpg",
        layout="C",
        arts=["hospital", "adopt", "valley"],
        texts=[
            "这一切在我出生之前就已注定。我的生母是一名年轻的未婚研究生，她决定把我送人收养。她强烈认为，收养我的人必须是大学毕业生。",
            "一切都安排好了：我一出生，就会被一对律师夫妇收养。可我出生后，他们在最后一刻决定只要女孩。候补名单上的养父母半夜接到电话：「我们意外有了一个男孩，你们要吗？」他们说：「当然。」\n\n后来生母发现，养母克拉拉从未大学毕业，养父保罗甚至没有高中毕业。她拒绝签署最终收养文件。几个月后，养父母承诺将来一定送我上大学，她才松口。",
            "这就是我人生的开始。他的生母坚持把孩子交给大学毕业生收养，结果养父母都没有大学学位。被遗弃与被选择，是同一枚硬币的两面。",
        ],
    ),
    dict(
        file="03.jpg",
        layout="A",
        arts=["valley", "garage", "valley", "garage", "two", "pc"],
        texts=[
            "他在加利福尼亚长大。养父保罗是一名机械技工，喜欢在周末拆装汽车和电器。",
            "洛斯阿尔托斯一带的街区里，许多邻居同样在自家车库里捣鼓电子元件——硅谷的硬件文化，就在这些不起眼的木门后面慢慢成形。",
            "保罗把工作台腾出一角给儿子。示波器、电阻、废弃的电视机壳，在孩子眼里比玩具更有吸引力。他学会问：这东西为什么这样工作？如果换一种方式，会不会更好？",
            "学校却是另一回事。他聪明，也难管。",
            "只有车库里的灯亮着时，世界才变得清晰。",
        ],
    ),
    dict(
        file="04.jpg",
        layout="B",
        arts=["two", "pc"],
        texts=[
            "他认识了另一个史蒂夫——沃兹尼亚克。沃兹沉迷电路，能把复杂的芯片排列变成优雅的设计；乔布斯则更关心：普通人为什么要碰这些东西？它应该长什么样？它怎样才能走进客厅？",
            "他们一起做出「蓝盒子」：一种能生成音频信号、免费拨打长途电话的装置。那是一场带着恶作剧意味的技术实践，也是第一次，他们把「能用」做成「可卖」。",
            "奇特的一对。一个把世界看成逻辑门与波形，一个把世界看成体验与欲望。没有其中任何一个，后来的苹果都不会是人们记得的那个样子。",
        ],
    ),
    dict(
        file="05.jpg",
        layout="C",
        arts=["calli", "calli", "mac"],
        texts=[
            "我选了一所学费几乎和斯坦福一样贵的私立学校。蓝领阶层的养父母兑现了承诺，把积蓄都拿出来供我读书。六个月后我看不出价值——我不知道自己想做什么，也不知道大学怎样帮我弄清楚。我决定退学，并相信事情总会好转。",
            "退学以后，我不必再上不感兴趣的必修课，可以去旁听书法。里德学院的书法课大概是当时全美最好的。海报、抽屉标签、手写标题，整个校园都写得很漂亮。\n\n我学的是衬线与无衬线字体，以及不同字母组合间的字间距，还有如何作出完美的版式。科学里通常没有这种美感、历史感与艺术的精微。它迷人，却在当时毫无实用。",
            "十年后，当我们设计第一台麦金塔电脑时，它们全都用上了。如果没有那门课，麦金塔就不会有那么多种比例优美的字体。",
        ],
    ),
    dict(
        file="06.jpg",
        layout="B",
        arts=["garage", "two"],
        texts=[
            "苹果公司在乔布斯父母位于洛斯阿尔托斯的车库里诞生。他们把主板放进木箱，卖给当地的电子爱好者。那不像一家公司，更像两个年轻人把周末消磨在焊接与调试上——直到订单多到无法忽视。",
            "保罗的工作台再次让出位置。邻居进出，零件散落，电话响个不停。「苹果」这个名字听起来友好、新鲜，带着一点加州的任性。",
            "没有风险投资的大理石门厅，没有产品发布会的聚光灯。只有车库门半开着，阳光切进灰尘里，一块电路板决定了后半生的方向。",
        ],
    ),
    dict(
        file="07.jpg",
        layout="A",
        arts=["pc", "mac", "pc", "mac", "garage", "stanford"],
        texts=[
            "个人计算机不该只是工程师的玩具，而应成为普通人的工具。",
            "乔布斯反复强调产品的完整：机箱、键盘、软件、包装，甚至打开盒子时的第一眼。细节不是装饰，细节就是产品本身。",
            "我们要在个人计算机领域留下自己的印记。这句话不是口号，而是一种标准——如果某样东西配不上「伟大」，它就不该从产线上下来。",
            "机器越来越小。",
            "计算可以发生在桌上，而不必躲在机房后面。",
        ],
    ),
    dict(
        file="08.jpg",
        layout="C",
        arts=["mac", "pc", "stanford"],
        texts=[
            "麦金塔被设计成「为每一个人准备的计算机」。图形界面、鼠标、字体——那些曾在书法课上显得无用的东西，忽然成了机器的灵魂。",
            "超级碗广告把一个锤子砸向巨幕上的权威面孔。旁白宣布：一九八四年不会是小说里的一九八四。那是产品发布，也是文化宣言——个人工具对抗冷冰冰的巨物。\n\n舞台上的乔布斯揭开罩布。观众看见的不只是一台电脑，而是一种关于自由、个性与控制权的想象。",
            "有人欢呼，有人怀疑。历史后来站在欢呼的那一边。",
        ],
    ),
    dict(
        file="09.jpg",
        layout="B",
        arts=["fired", "hospital"],
        texts=[
            "成功之后是失控。权力斗争、产品延期、性格冲突，把公司撕成碎片。董事会站在另一边。他失去了自己参与创建的苹果。",
            "我被自己创建的公司炒了鱿鱼。这在当时像公开的羞辱。他离开了园区，也离开了那个曾经属于他的舞台。",
            "可失败并不总是终点。他创办 NeXT，投资皮克斯，把动画变成一种新的电影语言。多年后回望，被驱逐反而是一剂最苦、也最有效的药——它逼他重新开始，逼他学会什么是真正重要的。",
        ],
    ),
    dict(
        file="10.jpg",
        layout="C",
        arts=["stanford", "mac", "fired"],
        texts=[
            "他回到苹果，把几乎破产的公司拉回桌面中央。工具再次变得个人、便携、亲密。人们口袋里装着一台计算机，却很少再叫它计算机。",
            "在斯坦福大学的毕业典礼上，他讲了三个故事：串起生命中的点点滴滴；爱与失去；死亡是人生最好的发明。他没有给学生成功学公式，只把自己的疤痕摊开。\n\n求知若饥，虚心若愚。那不是一句广告，而是一个被遗弃又被选择的人，对后来者最简洁的嘱咐。",
            "保持饥饿，保持愚蠢——也保持对完美版式般细节的偏执。",
        ],
    ),
]


def main() -> None:
    for p in PAGES:
        arts = [ART[k] for k in p["arts"]]
        for a in arts:
            if not a.exists():
                raise SystemExit(f"missing {a}")
        out = OUT / p["file"]
        if p["layout"] == "A":
            compose_layout_A(arts, p["texts"], out)
        elif p["layout"] == "B":
            compose_layout_B(arts, p["texts"], out)
        else:
            compose_layout_C(arts, p["texts"], out)


if __name__ == "__main__":
    main()
