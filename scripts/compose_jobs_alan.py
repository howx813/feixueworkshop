#!/usr/bin/env python3
"""Compose Jobs graphic novel pages: Alan's War style (long text + soft illust)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
IMG = Path.home() / ".grok/sessions/%2FUsers%2Fxuhao/019f9d11-0232-75c3-a12e-3477eba1d961/images"
OUT = ROOT / "public/graphic/jobs"
W, H = 900, 1400
MARGIN = 48
GAP = 16
PAPER = (248, 246, 240)
INK = (32, 32, 32)
MUTED = (90, 90, 90)
RULE = (180, 178, 172)

# Prefer readable Chinese serif-like
FONT_CANDIDATES = [
    "/System/Library/Fonts/STSong.ttc",
    "/System/Library/Fonts/Supplemental/Songti.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/Library/Fonts/Arial Unicode.ttf",
    "/System/Library/Fonts/PingFang.ttc",
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for p in FONT_CANDIDATES:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size=size, index=0)
            except OSError:
                continue
    return ImageFont.load_default()


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_w: int) -> list[str]:
    lines: list[str] = []
    for para in text.split("\n"):
        if not para.strip():
            lines.append("")
            continue
        buf = ""
        for ch in para:
            trial = buf + ch
            if draw.textlength(trial, font=font) <= max_w:
                buf = trial
            else:
                if buf:
                    lines.append(buf)
                buf = ch
        if buf:
            lines.append(buf)
    return lines


def fit_image(path: Path, max_w: int, max_h: int) -> Image.Image:
    im = Image.open(path).convert("RGB")
    # gentle grayscale wash feel
    g = im.convert("L").convert("RGB")
    g.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    return g


def compose_page(
    title: str,
    body: str,
    quote: str | None,
    art_main: Path,
    art_small: Path | None,
    out_path: Path,
) -> None:
    page = Image.new("RGB", (W, H), PAPER)
    draw = ImageDraw.Draw(page)
    font_title = load_font(36)
    font_body = load_font(22)
    font_quote = load_font(20)
    font_meta = load_font(16)

    y = MARGIN
    # meta
    draw.text((MARGIN, y), "史蒂夫·乔布斯传  ·  纪实漫画", font=font_meta, fill=MUTED)
    y += 28
    draw.line([(MARGIN, y), (W - MARGIN, y)], fill=RULE, width=1)
    y += GAP

    # title
    draw.text((MARGIN, y), title, font=font_title, fill=INK)
    y += 48

    content_w = W - 2 * MARGIN
    main_h = 340
    main = fit_image(art_main, content_w, main_h)
    # center main art
    mx = MARGIN + (content_w - main.width) // 2
    page.paste(main, (mx, y))
    # thin border
    draw.rectangle([mx - 1, y - 1, mx + main.width, y + main.height], outline=RULE)
    y += main.height + GAP + 8

    # body text — primary, not optional
    lines = wrap_text(draw, body, font_body, content_w)
    line_h = 34
    # reserve space for small art + quote
    reserve = 220 if art_small else 120
    max_body_y = H - MARGIN - reserve

    # if small art, layout: text flows, then small image left + remaining text right mid
    i = 0
    while i < len(lines) and y + line_h < max_body_y - 160:
        line = lines[i]
        if line == "":
            y += line_h // 2
        else:
            draw.text((MARGIN, y), line, font=font_body, fill=INK)
            y += line_h
        i += 1

    if art_small and art_small.exists():
        y += 8
        small = fit_image(art_small, 320, 200)
        page.paste(small, (MARGIN, y))
        draw.rectangle(
            [MARGIN - 1, y - 1, MARGIN + small.width, y + small.height],
            outline=RULE,
        )
        # remaining text beside small image
        side_x = MARGIN + small.width + 20
        side_w = W - MARGIN - side_x
        side_y = y
        while i < len(lines) and side_y + line_h < y + small.height:
            line = lines[i]
            if line:
                # re-wrap for side width roughly by char count
                chunk = line
                # simple: draw if fits
                if draw.textlength(chunk, font=font_body) > side_w:
                    # break chunk
                    buf = ""
                    for ch in chunk:
                        if draw.textlength(buf + ch, font=font_body) <= side_w:
                            buf += ch
                        else:
                            draw.text((side_x, side_y), buf, font=font_body, fill=INK)
                            side_y += line_h
                            buf = ch
                    if buf:
                        draw.text((side_x, side_y), buf, font=font_body, fill=INK)
                        side_y += line_h
                else:
                    draw.text((side_x, side_y), chunk, font=font_body, fill=INK)
                    side_y += line_h
            else:
                side_y += line_h // 2
            i += 1
        y = max(y + small.height, side_y) + GAP
    else:
        while i < len(lines) and y + line_h < H - MARGIN - 100:
            line = lines[i]
            if line == "":
                y += line_h // 2
            else:
                draw.text((MARGIN, y), line, font=font_body, fill=INK)
                y += line_h
            i += 1

    # remaining lines if any
    while i < len(lines) and y + line_h < H - MARGIN - 80:
        line = lines[i]
        if line == "":
            y += line_h // 2
        else:
            draw.text((MARGIN, y), line, font=font_body, fill=INK)
            y += line_h
        i += 1

    if quote:
        y = max(y + 12, H - MARGIN - 90)
        draw.line([(MARGIN, y), (W - MARGIN, y)], fill=RULE, width=1)
        y += 12
        q_lines = wrap_text(draw, "「" + quote + "」", font_quote, content_w)
        for ql in q_lines:
            draw.text((MARGIN, y), ql, font=font_quote, fill=MUTED)
            y += 28

    out_path.parent.mkdir(parents=True, exist_ok=True)
    page.save(out_path, "JPEG", quality=93, optimize=True)
    print("wrote", out_path, "chars≈", len(body))


# Illustration map (session images)
A = {
    "hospital": IMG / "437.jpg",
    "adopt": IMG / "439.jpg",
    "valley": IMG / "438.jpg",
    "two_steves": IMG / "441.jpg",
    "calligraphy": IMG / "440.jpg",
    "garage": IMG / "445.jpg",
    "pc": IMG / "444.jpg",
    "mac": IMG / "443.jpg",
    "fired": IMG / "446.jpg",
    "stanford": IMG / "442.jpg",
}

PAGES = [
    {
        "file": "02.jpg",
        "title": "被遗弃与被选择",
        "main": "hospital",
        "small": "adopt",
        "quote": "他的生母坚持把孩子交给大学毕业生收养，结果养父母都没有大学学位。",
        "body": (
            "这一切在我出生之前就已注定。我的生母是一名年轻的未婚研究生，"
            "她决定把我送人收养。她强烈认为，收养我的人必须是大学毕业生。"
            "一切都安排好了：我一出生，就会被一对律师夫妇收养。"
            "\n"
            "可我出生后，他们在最后一刻决定只要女孩。候补名单上的养父母半夜接到电话："
            "「我们意外有了一个男孩，你们要吗？」他们说：「当然。」"
            "\n"
            "后来生母发现，养母克拉拉从未大学毕业，养父保罗甚至没有高中毕业。"
            "她拒绝签署最终收养文件。几个月后，养父母承诺将来一定送我上大学，她才松口。"
            "这就是我人生的开始。"
            "\n"
            "保罗·乔布斯和克拉拉·乔布斯成了我的父母。他们没有律师夫妇的学位，"
            "却给了我一个家。多年以后回望，被遗弃与被选择，是同一枚硬币的两面。"
        ),
    },
    {
        "file": "03.jpg",
        "title": "硅谷",
        "main": "valley",
        "small": "garage",
        "quote": "父亲的车库里堆满了零件，那是他最早的课堂。",
        "body": (
            "他在加利福尼亚长大。养父保罗是一名机械技工，喜欢在周末拆装汽车和电器。"
            "洛斯阿尔托斯一带的街区里，许多邻居同样在自家车库里捣鼓电子元件——"
            "硅谷的硬件文化，就在这些不起眼的木门后面慢慢成形。"
            "\n"
            "保罗把工作台腾出一角给儿子。示波器、电阻、废弃的电视机壳，"
            "在孩子眼里比玩具更有吸引力。他学会问：这东西为什么这样工作？"
            "如果换一种方式，会不会更好？"
            "\n"
            "学校却是另一回事。他聪明，也难管；功课对他太浅，规矩对他太重。"
            "老师们看到一个不肯安分的孩子，邻居们看到一个有点奇怪的男孩。"
            "只有车库里的灯亮着时，世界才变得清晰。"
        ),
    },
    {
        "file": "04.jpg",
        "title": "两个史蒂夫",
        "main": "two_steves",
        "small": "pc",
        "quote": "一个善于发明，一个善于把发明变成人们想要的东西。",
        "body": (
            "他认识了另一个史蒂夫——沃兹尼亚克。沃兹沉迷电路，能把复杂的芯片排列"
            "变成优雅的设计；乔布斯则更关心：普通人为什么要碰这些东西？"
            "它应该长什么样？它怎样才能走进客厅？"
            "\n"
            "他们一起做出「蓝盒子」：一种能生成音频信号、免费拨打长途电话的装置。"
            "那是一场带着恶作剧意味的技术实践，也是第一次，他们把「能用」做成「可卖」。"
            "\n"
            "奇特的一对。一个把世界看成逻辑门与波形，一个把世界看成体验与欲望。"
            "没有其中任何一个，后来的苹果都不会是人们记得的那个样子。"
        ),
    },
    {
        "file": "05.jpg",
        "title": "书法",
        "main": "calligraphy",
        "small": "valley",
        "quote": "我学的是衬线与无衬线字体，以及不同字母组合间的字间距，还有如何作出完美的版式。",
        "body": (
            "我选了一所学费几乎和斯坦福一样贵的私立学校。蓝领阶层的养父母兑现了承诺，"
            "把积蓄都拿出来供我读书。六个月后我看不出价值——我不知道自己想做什么，"
            "也不知道大学怎样帮我弄清楚。我决定退学，并相信事情总会好转。"
            "\n"
            "退学以后，我不必再上不感兴趣的必修课，可以去旁听书法。"
            "里德学院的书法课大概是当时全美最好的。海报、抽屉标签、手写标题，"
            "整个校园都写得很漂亮。"
            "\n"
            "我学的是衬线与无衬线字体，以及不同字母组合间的字间距，还有如何作出完美的版式。"
            "科学里通常没有这种美感、历史感与艺术的精微。它迷人，却在当时毫无实用。"
            "十年后，当我们设计第一台麦金塔电脑时，它们全都用上了。如果没有那门课，"
            "麦金塔就不会有那么多种比例优美的字体。"
        ),
    },
    {
        "file": "06.jpg",
        "title": "车库",
        "main": "garage",
        "small": "two_steves",
        "quote": "苹果公司在乔布斯父母位于洛斯阿尔托斯的车库里诞生。",
        "body": (
            "苹果公司在乔布斯父母位于洛斯阿尔托斯的车库里诞生。"
            "他们把主板放进木箱，卖给当地的电子爱好者。那不像一家公司，"
            "更像两个年轻人把周末消磨在焊接与调试上——直到订单多到无法忽视。"
            "\n"
            "保罗的工作台再次让出位置。邻居进出，零件散落，电话响个不停。"
            "「苹果」这个名字听起来友好、新鲜，带着一点加州的任性。"
            "\n"
            "没有风险投资的大理石门厅，没有产品发布会的聚光灯。"
            "只有车库门半开着，阳光切进灰尘里，一块电路板决定了后半生的方向。"
        ),
    },
    {
        "file": "07.jpg",
        "title": "个人计算机",
        "main": "pc",
        "small": "mac",
        "quote": "我们要在个人计算机领域留下自己的印记。",
        "body": (
            "个人计算机不该只是工程师的玩具，而应成为普通人的工具。"
            "乔布斯反复强调产品的完整：机箱、键盘、软件、包装，甚至打开盒子时的第一眼。"
            "细节不是装饰，细节就是产品本身。"
            "\n"
            "我们要在个人计算机领域留下自己的印记。"
            "这句话不是口号，而是一种标准——如果某样东西配不上「伟大」，"
            "它就不该从产线上下来。"
            "\n"
            "机器越来越小，野心越来越大。人们开始相信：计算可以发生在桌上，"
            "而不必躲在机房的玻璃墙后面。"
        ),
    },
    {
        "file": "08.jpg",
        "title": "一九八四",
        "main": "mac",
        "small": "pc",
        "quote": "1984 不会是《1984》。",
        "body": (
            "麦金塔被设计成「为每一个人准备的计算机」。图形界面、鼠标、字体——"
            "那些曾在书法课上显得无用的东西，忽然成了机器的灵魂。"
            "\n"
            "超级碗广告把一个锤子砸向巨幕上的权威面孔。"
            "旁白宣布：1984 不会是《1984》。"
            "那是产品发布，也是文化宣言——个人工具对抗冷冰冰的巨物。"
            "\n"
            "舞台上的乔布斯揭开罩布。观众看见的不只是一台电脑，"
            "而是一种关于自由、个性与控制权的想象。有人欢呼，有人怀疑；"
            "历史后来站在欢呼的那一边。"
        ),
    },
    {
        "file": "09.jpg",
        "title": "离开",
        "main": "fired",
        "small": "hospital",
        "quote": "我被自己创建的公司炒了鱿鱼。",
        "body": (
            "成功之后是失控。权力斗争、产品延期、性格冲突，把公司撕成碎片。"
            "董事会站在另一边。他失去了自己参与创建的苹果。"
            "\n"
            "我被自己创建的公司炒了鱿鱼。"
            "这在当时像公开的羞辱。他离开了园区，也离开了那个曾经属于他的舞台。"
            "\n"
            "可失败并不总是终点。他创办 NeXT，收购皮克斯，把动画变成一种新的电影语言。"
            "多年后回望，被驱逐反而是一剂最苦、也最有效的药——"
            "它逼他重新开始，逼他学会什么是真正重要的。"
        ),
    },
    {
        "file": "10.jpg",
        "title": "求知若饥",
        "main": "stanford",
        "small": "mac",
        "quote": "求知若饥，虚心若愚。",
        "body": (
            "他回到苹果，把几乎破产的公司拉回桌面中央：一体成型彩色电脑、音乐播放器、手机……"
            "工具再次变得个人、便携、亲密。人们口袋里装着一台计算机，却很少再叫它计算机。"
            "\n"
            "在斯坦福大学的毕业典礼上，他讲了三个故事：串起生命中的点点滴滴；"
            "爱与失去；死亡是人生最好的发明。"
            "他没有给学生成功学公式，只把自己的疤痕摊开。"
            "\n"
            "求知若饥，虚心若愚。"
            "那不是一句广告，而是一个被遗弃又被选择的人，对后来者最简洁的嘱咐："
            "保持饥饿，保持愚蠢——也保持对完美版式般细节的偏执。"
        ),
    },
]


def main() -> None:
    missing = [k for k, p in A.items() if not p.exists()]
    if missing:
        raise SystemExit(f"missing art: {missing}")
    for p in PAGES:
        compose_page(
            title=p["title"],
            body=p["body"],
            quote=p.get("quote"),
            art_main=A[p["main"]],
            art_small=A.get(p["small"]) if p.get("small") else None,
            out_path=OUT / p["file"],
        )


if __name__ == "__main__":
    main()
