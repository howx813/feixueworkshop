import type { Metadata } from "next";
import Link from "next/link";
import {
  FourierBuildDemo,
  FourierEpicycleDemo,
  FourierSpectrumDemo,
} from "@/components/FourierDemo";
import { Narration } from "@/components/demokit";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "傅里叶变换，一次讲透",
  description: `${site.name}${labMeta.name} · 时域频域动画解说：傅里叶变换到底在干嘛。`,
};

export default function LabFourierPage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}Fourier transform
      </p>
      <h1 className="page-title">傅里叶变换，一次讲透</h1>
      <p className="page-desc">
        三段动画 + 解说词，把「时域」「频域」和傅里叶变换讲明白：
        它不是把信号变成别的东西，而是<strong>换一种看法</strong>。
      </p>

      <div className="day-bar">
        <strong>时域 ⇄ 频域</strong>
        <span>一台「配方分析仪」</span>
      </div>

      {/* ---------- 第一节：先给结论 ---------- */}
      <article className="card card-pad">
        <h2 className="item-title" style={{ marginTop: 0 }}>
          先给结论：它是一台配方分析仪
        </h2>
        <p className="item-body">
          傅里叶变换回答的问题只有一个：
          <strong>
            这段复杂的波形，是由哪些不同频率的纯音、各占多少，混出来的？
          </strong>
        </p>
        <p className="item-body">
          把一杯奶昔送进分析仪，出来一张配方：草莓 40%、香蕉 35%、牛奶 25%。
          奶昔本身没变，但你拿到了它的「成分表」。有了成分表，你就能挑掉不喜欢的
          （降噪）、只保留重要的（压缩）、照着重新调一杯（重建信号）。
        </p>
        <Narration
          text="傅里叶变换做的事，一句话：把一段复杂的波形，拆成一堆不同频率、不同大小的简单正弦波。就像把一杯奶昔还原成配方表：草莓多少、香蕉多少、牛奶多少。时域，是你尝到的那口味道随时间的变化；频域，是那张配方表。它们描述的是同一杯奶昔，只是看法不同。"
        />
      </article>

      {/* ---------- 第二节：时域与频域 ---------- */}
      <article className="card card-pad" style={{ marginTop: 16 }}>
        <h2 className="item-title" style={{ marginTop: 0 }}>
          时域和频域：同一件事的两种看法
        </h2>
        <p className="item-body">
          弹一个和弦（do、mi、sol 同时按下）：
        </p>
        <ul className="item-body" style={{ paddingLeft: 20, margin: 0 }}>
          <li>
            <strong>时域</strong>：空气压力随时间上下起伏的那条曲线——「什么时候
            振多狠」。录音软件里看到的就是它。
          </li>
          <li>
            <strong>频域</strong>：三根柱子，分别立在 do、mi、sol 的频率上——
            「由哪些音组成，各有多响」。调音台的频谱灯就是它。
          </li>
        </ul>
        <p className="item-body" style={{ marginTop: 10 }}>
          <strong>傅里叶变换</strong>就是从左图算出右图的那台机器；
          <strong>傅里叶反变换</strong>则照着配方把波形原样调回来。
          信息一点不少，只是换了个坐标系。
        </p>
        <Narration text="时域和频域，不是两个东西，是同一段信号的两种看法。时域告诉你：每个时刻，波形振得多高。频域告诉你：这段波形里，每个频率的成分有多少。傅里叶变换，就是从时域算出频域的那台机器；反过来，还能照着配方把波形原样调回来。信息一点没少，只是换了个坐标系。就像同一座城市，地图和街景是两种看法。" />
      </article>

      {/* ---------- 动画一 ---------- */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">动画一 · 用纯音搭积木</h2>
          <span className="section-meta">方波 = sinθ + ⅓sin3θ + ⅕sin5θ + …</span>
        </div>
        <FourierBuildDemo />
        <Narration text="看这张动画：一条棱是棱、角是角的方波，居然可以用一条条光滑的波浪搭出来。第一条大波浪定出轮廓，再加上频率三倍、五倍、七倍、越来越细的小波浪，每加一条，方波就挺一点。加到无穷多条，就严丝合缝。这就是傅里叶的核心断言：任何周期波形，都能用一堆正弦波搭出来。" />
      </section>

      {/* ---------- 动画二 ---------- */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">动画二 · 每个纯音都是一个旋转的圆</h2>
          <span className="section-meta">epicycles</span>
        </div>
        <FourierEpicycleDemo />
        <Narration text="换个角度看正弦波：它其实是一个匀速旋转的圆，在竖直方向上的投影。所以，叠加正弦波，就等于把一串圆首尾相接：大圆上套小圆，小圆上套更小的圆，各自的转速是一倍、三倍、五倍。盯住最后那个黄色端点的高度，往右边展开，画出来的就是方波。这一串旋转的圆，就是方波的频域配方，活了过来。" />
      </section>

      {/* ---------- 动画三 ---------- */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">动画三 · 时域 ⇄ 频域联动实验室</h2>
          <span className="section-meta">拖动滑杆看两边一起变</span>
        </div>
        <FourierSpectrumDemo />
        <Narration text="现在把两种看法放在一起。左边是时域：波形随时间怎么振。右边是频域：每根柱子是一个频率成分，柱子越高，这个成分越强。拨动滑杆，右边每亮一根柱子，左边就添上一笔，波形一步步逼近理想形状。再切换方波、锯齿波、三角波：形状不同，配方也完全不同。注意方波棱角上抖动的小尾巴，那叫吉布斯现象：成分不够多，就永远抚不平。" />
      </section>

      {/* ---------- 用来干嘛 ---------- */}
      <article className="card card-pad">
        <h2 className="item-title" style={{ marginTop: 0 }}>
          所以，它到底用来干嘛？
        </h2>
        <p className="item-body">
          你每天都在用傅里叶变换，只是看不见它：
        </p>
        <ul className="item-body" style={{ paddingLeft: 20, margin: 0 }}>
          <li>
            <strong>听歌（MP3）</strong>：把声音切成各个频率，人耳听不清的频段直接
            扔掉，文件小十倍，听起来差不多。
          </li>
          <li>
            <strong>照片（JPEG）</strong>：图像版的傅里叶（DCT），丢掉眼睛看不出
            差别的细节，才有今天的表情包。
          </li>
          <li>
            <strong>降噪耳机 / 通话降噪</strong>：噪声在频域里有固定位置，找到它，
            精确抵消或滤掉。
          </li>
          <li>
            <strong>5G / Wi-Fi（OFDM）</strong>：把数据摊到几百个并排的频率上同时
            发，靠傅里叶变换打包、拆包。
          </li>
          <li>
            <strong>CT / MRI</strong>：机器收到的原始数据本来就是频域的，靠傅里叶
            反变换重建出你身体的断层图像。
          </li>
          <li>
            <strong>听歌识曲 / 声纹识别</strong>：把声音变成一张「频率指纹」去比对。
          </li>
        </ul>
        <p className="item-body" style={{ marginTop: 10 }}>
          让它真正普及的是 <strong>FFT</strong>（快速傅里叶变换，1965）：把计算量从
          N² 降到 N log N，一千万点的信号从「算一天」变成「眨眼之间」，
          上面这些实时应用才成为可能——它常被称为 20 世纪最重要的算法之一。
        </p>
        <Narration text="那它到底用来干嘛？答案是：你每天都在用。MP3 把听不清的频段扔掉，文件小十倍；JPEG 用同样的思路压缩照片；降噪耳机在频域里找到噪声，精确抵消；5G 和 Wi-Fi 把数据摊到几百个频率上同时发；CT 和核磁共振收到的原始数据本来就是频域的，靠傅里叶反变换重建出你的身体。而让它能实时跑起来的，是 1965 年的快速傅里叶变换 FFT，计算量从 N 的平方降到 N 乘 log N。它常被称为二十世纪最重要的算法之一。" />
      </article>

      {/* ---------- 收尾 ---------- */}
      <div className="card-quiet card-pad" style={{ marginTop: 24 }}>
        <h2 className="item-title" style={{ marginTop: 0 }}>
          带走一句话
        </h2>
        <p className="item-body">
          傅里叶变换不是把信号变成别的东西，而是<strong>换一种看法</strong>：
          从「什么时候」换成「有哪些频率」。
          很多问题在时域里是一团乱麻，换到频域，一眼看穿。
        </p>
        <p className="item-body" style={{ marginTop: 8 }}>
          学完想上手？去{" "}
          <Link href="/lab/spectrum/" className="link-accent">
            频谱显微镜
          </Link>
          ，拿自己的声音实时验证一遍 →
        </p>
      </div>

      <div style={{ marginTop: 20 }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
      </div>
    </div>
  );
}
