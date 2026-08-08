import type { Metadata } from "next";
import Link from "next/link";
import {
  MicGate,
  PitchMeter,
  ScopeSpectrum,
  Spectrogram,
  SpectrumRoot,
  ToneLab,
} from "@/components/SpectrumDemo";
import { Narration } from "@/components/demokit";
import { labMeta } from "@/data/lab";
import { site } from "@/data/content";

export const metadata: Metadata = {
  title: "频谱显微镜",
  description: `${site.name}${labMeta.name} · 打开麦克风，实时看到自己声音的波形、频谱与音高。`,
};

export default function LabSpectrumPage() {
  return (
    <div className="page">
      <p className="page-kicker">
        <Link href="/lab/" className="link-accent">
          {labMeta.name}
        </Link>
        {" · "}Spectrum microscope
      </p>
      <h1 className="page-title">频谱显微镜</h1>
      <p className="page-desc">
        在{" "}
        <Link href="/lab/fourier/" className="link-accent">
          傅里叶页
        </Link>{" "}
        学了「时域 ⇄ 频域」？现在拿自己的声音验证一遍：
        打开麦克风，<strong>你的声音</strong>就是实验材料。
      </p>

      <div className="day-bar">
        <strong>本地实时分析</strong>
        <span>不录音 · 不上传</span>
      </div>

      <SpectrumRoot>
        <MicGate />

        {/* ---------- 仪器① ---------- */}
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">仪器① · 示波器 + 频谱柱</h2>
            <span className="section-meta">时域 ⇄ 频域</span>
          </div>
          <ScopeSpectrum />
          <Narration text="这就是傅里叶变换在实时发生。上面是时域：空气压力随时间怎么振；下面是频域：你的声音此刻由哪些频率组成。说一声「啊——」，看最左边那根最高的柱子，那通常是你的基音。再拍手一下：宽宽的一片柱子，说明噪声的能量摊在所有频率上。" />
        </section>

        {/* ---------- 仪器② ---------- */}
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">仪器② · 瀑布频谱</h2>
            <span className="section-meta">频率 × 时间 × 响度</span>
          </div>
          <Spectrogram />
          <Narration text="把每一瞬间的频谱叠成一条彩虹河：横轴是频率，纵轴是时间，颜色越红越响。吹一声口哨，从低音滑到高音，河面上会留下一道明亮的滑梯。听歌识曲认的就是这张指纹图——它不关心你唱什么词，只关心这些亮线的形状。" />
        </section>

        {/* ---------- 仪器③ ---------- */}
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">仪器③ · 音高表</h2>
            <span className="section-meta">自相关估基频</span>
          </div>
          <PitchMeter />
          <Narration text="这是一台迷你调音器。它的算法很朴素：把波形和错开一点的自己比一比，找到「每隔多久重复一次」，倒数就是基频。哼一个长音，它会告诉你音名，比如 A4，还有偏了多少音分——一音分是两个相邻琴键距离的百分之一。指针停在中间，就是准了。" />
        </section>

        {/* ---------- 仪器④ ---------- */}
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">仪器④ · 纯音发生器 + 小键盘</h2>
            <span className="section-meta">没麦克风也能玩</span>
          </div>
          <ToneLab />
          <Narration text="不好意思开口？让机器自己发声。点「发声」，把频率滑到 440，再抬头看频谱：柱子正好立在 440 上——这就是频谱显微镜的出厂自检。换成方波，看三倍、五倍频率上冒出来的柱子，那就是傅里叶页搭过的积木。小键盘按住就响，弹个 do，看音高表认不认得它。" />
        </section>
      </SpectrumRoot>

      {/* ---------- 原理收尾 ---------- */}
      <article className="card card-pad">
        <h2 className="item-title" style={{ marginTop: 0 }}>
          它怎么做到的？
        </h2>
        <p className="item-body">
          浏览器每秒钟从麦克风取几百帧采样，每帧 4096 个点，交给
          <strong> FFT</strong>（快速傅里叶变换）算出这 4096 个点的频谱，
          再画成你看到的柱子和彩虹。一次变换不到一毫秒——
          这就是 1965 年那个「N² → N log N」的算法在实时干活。
        </p>
        <p className="item-body">
          你手里的这台显微镜，和现实世界的对应物：
        </p>
        <ul className="item-body" style={{ paddingLeft: 20, margin: 0 }}>
          <li>
            <strong>仪器①</strong> → 音频工作台的电平表与频谱仪，混音师的日常。
          </li>
          <li>
            <strong>仪器②</strong> → 听歌识曲的「声纹指纹」、语音识别的输入图。
          </li>
          <li>
            <strong>仪器③</strong> → 吉他调音器、KTV 评分、乐器校音。
          </li>
          <li>
            <strong>仪器④</strong> → 合成器的振荡器，电子音乐的最小零件。
          </li>
        </ul>
        <Narration text="原理一句话：浏览器每秒把声音切成几百小段，每段交给快速傅里叶变换算出频谱，再画出来。一次变换不到一毫秒，所以它能跟上你的声音。你刚才玩的四件仪器，对应着真实世界里的混音师频谱仪、听歌识曲的指纹、吉他调音器和合成器的振荡器。下次再听到「傅里叶」，你不仅会背定义，还亲手玩过它。" />
      </article>

      {/* ---------- 试试看 ---------- */}
      <div className="card-quiet card-pad" style={{ marginTop: 24 }}>
        <h2 className="item-title" style={{ marginTop: 0 }}>
          试试看（三个小挑战）
        </h2>
        <ol className="math-steps">
          <li>
            哼一个长音，让音高表说出它的名字——你哼的是哪个音？
          </li>
          <li>
            发生器开到 440Hz 别关，跟着哼，把音高表的指针怼到正中间。
          </li>
          <li>
            吹口哨从低滑到高，在瀑布上画出一条尽量平滑的彩虹滑梯。
          </li>
        </ol>
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link href="/lab/" className="btn btn-ghost">
          ← 回{labMeta.name}
        </Link>
        <Link href="/lab/fourier/" className="btn btn-ghost">
          重温傅里叶变换 →
        </Link>
      </div>
    </div>
  );
}
