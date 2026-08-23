"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * 标讯星图 —— 每颗星是一条真实标讯。
 * 行业 → 星团方位；金额 → 亮度与尺寸；星级 → 颜色（5金/4青/3白）。
 * Orbit camera + raycast hover tooltip + click opens source.
 */

interface StarItem {
  id: string;
  title: string;
  date: string;
  buyer: string;
  moneyWan: number | null;
  professions: string[];
  stars: number;
  stageName?: string;
  sourceUrl?: string;
}

const STAR_COLORS: Record<number, string> = {
  5: "#ffd166", // 五星 · 金
  4: "#6fd6e8", // 四星 · 青
  3: "#e8e6df", // 三星 · 白
};
const DEFAULT_COLOR = "#8f95a3";

// deterministic hash so layout is stable across reloads
function hash01(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** Assign each profession-cluster an angle; stars orbit their cluster center. */
function layoutStars(items: StarItem[]): {
  positions: Float32Array;
  sizes: Float32Array;
  colors: Float32Array;
  clusterCenters: { name: string; x: number; z: number }[];
} {
  // group by primary profession
  const clusters = new Map<string, StarItem[]>();
  for (const it of items) {
    const key = it.professions?.[0] || "其他";
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key)!.push(it);
  }
  const names = Array.from(clusters.keys()).sort();
  const n = names.length;

  const positions = new Float32Array(items.length * 3);
  const sizes = new Float32Array(items.length);
  const colors = new Float32Array(items.length * 3);
  const idToIndex = new Map<string, number>();
  items.forEach((it, i) => idToIndex.set(it.id, i));

  const clusterCenters: { name: string; x: number; z: number }[] = [];
  const GALAXY_R = 26;

  names.forEach((name, ci) => {
    const angle = (ci / n) * Math.PI * 2;
    const armLen = GALAXY_R * (0.45 + 0.55 * hash01(name));
    const cxx = Math.cos(angle) * armLen;
    const czz = Math.sin(angle) * armLen;
    clusterCenters.push({ name, x: cxx, z: czz });

    const list = clusters.get(name)!;
    list.forEach((it) => {
      const i = idToIndex.get(it.id)!;
      // scatter within a blob around the cluster center
      const r = 1.2 + hash01(it.id + "r") * 4.2;
      const a = hash01(it.id + "a") * Math.PI * 2;
      const yy = (hash01(it.id + "y") - 0.5) * 5;
      positions[i * 3] = cxx + Math.cos(a) * r;
      positions[i * 3 + 1] = yy;
      positions[i * 3 + 2] = czz + Math.sin(a) * r;

      // money → size & brightness
      const money = typeof it.moneyWan === "number" ? it.moneyWan : 0;
      const mag = money > 0 ? Math.min(1, Math.log10(money + 1) / 4) : 0.12;
      sizes[i] = 1.6 + mag * 5.2;

      const hex = STAR_COLORS[it.stars] || DEFAULT_COLOR;
      const col = new THREE.Color(hex);
      // brighter with money
      const boost = 0.65 + mag * 0.35;
      colors[i * 3] = col.r * boost;
      colors[i * 3 + 1] = col.g * boost;
      colors[i * 3 + 2] = col.b * boost;
    });
  });

  return { positions, sizes, colors, clusterCenters };
}

export default function TenderGalaxy() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState("连接雷达…");
  const [hover, setHover] = useState<{
    title: string;
    buyer: string;
    moneyText: string;
    stage: string;
    date: string;
    url: string | null;
    sx: number;
    sy: number;
  } | null>(null);
  const hoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setFailed(true);
      return;
    }
    const W = mount.clientWidth || 800;
    const H = mount.clientHeight || 560;
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070d);
    scene.fog = new THREE.FogExp2(0x05070d, 0.008);

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 300);
    const camState = { yaw: 0.9, pitch: 0.55, dist: 52 };
    const lookAt = new THREE.Vector3(0, 0, 0);

    function applyCamera() {
      const { yaw, pitch, dist } = camState;
      camera.position.set(
        lookAt.x + Math.sin(yaw) * Math.cos(pitch) * dist,
        lookAt.y + Math.sin(pitch) * dist,
        lookAt.z + Math.cos(yaw) * Math.cos(pitch) * dist
      );
      camera.lookAt(lookAt);
    }
    applyCamera();

    // faint dust backdrop
    {
      const dustGeo = new THREE.BufferGeometry();
      const N = 1200;
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 160;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 160;
      }
      dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const dust = new THREE.Points(
        dustGeo,
        new THREE.PointsMaterial({
          color: 0x39435c,
          size: 0.7,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.55,
        })
      );
      scene.add(dust);
    }

    // star points built after data loads
    let points: THREE.Points | null = null;
    let starMeta: StarItem[] = [];
    let raycastTargets: THREE.BufferAttribute | null = null;

    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = spriteCanvas.height = 64;
    {
      const c = spriteCanvas.getContext("2d")!;
      const grad = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.25, "rgba(255,255,255,0.85)");
      grad.addColorStop(0.6, "rgba(255,255,255,0.18)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = grad;
      c.fillRect(0, 0, 64, 64);
    }
    const spriteTex = new THREE.CanvasTexture(spriteCanvas);

    async function loadData() {
      setStatus("拉取标讯快照…");
      try {
        const res = await fetch("/data/tenders.json", { cache: "no-store" });
        const json = await res.json();
        const items: StarItem[] = (json.items || []).filter(
          (it: StarItem) => it.title
        );
        starMeta = items;
        const { positions, sizes, colors, clusterCenters } = layoutStars(items);

        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        raycastTargets = geo.getAttribute("position") as THREE.BufferAttribute;

        const mat = new THREE.ShaderMaterial({
          uniforms: { uTex: { value: spriteTex }, uScale: { value: H } },
          vertexShader: `
            attribute float size;
            varying vec3 vColor;
            void main() {
              vColor = color;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (uScale / -mv.z);
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: `
            uniform sampler2D uTex;
            varying vec3 vColor;
            void main() {
              vec4 t = texture2D(uTex, gl_PointCoord);
              gl_FragColor = vec4(vColor, 1.0) * t;
            }
          `,
          vertexColors: true,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        points = new THREE.Points(geo, mat);
        scene.add(points);

        // cluster labels as sprites
        const labelGroup = new THREE.Group();
        for (const cc of clusterCenters) {
          const cv = document.createElement("canvas");
          cv.width = 256;
          cv.height = 64;
          const c = cv.getContext("2d")!;
          c.font = "bold 28px 'PingFang SC', sans-serif";
          c.fillStyle = "rgba(190,205,230,0.85)";
          c.textAlign = "center";
          c.fillText(cc.name, 128, 40);
          const tex = new THREE.CanvasTexture(cv);
          tex.colorSpace = THREE.SRGBColorSpace;
          const sp = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
          );
          sp.scale.set(7, 1.75, 1);
          sp.position.set(cc.x, 4.2, cc.z);
          labelGroup.add(sp);
        }
        scene.add(labelGroup);

        setStatus(`${items.length} 条标讯在图 · 悬停查看 · 点击跳原文`);
      } catch {
        setStatus("数据加载失败，稍后刷新重试");
      }
    }
    loadData();

    // ---------- interaction ----------
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let downX = 0;
    let downY = 0;
    let hoverIdx = -1;
    let hoverUrl: string | null = null;
    const el = renderer.domElement;
    el.style.touchAction = "none";
    el.style.cursor = "grab";

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) {
        camState.yaw -= (e.clientX - lastX) * 0.005;
        camState.pitch = Math.min(
          1.3,
          Math.max(-0.2, camState.pitch + (e.clientY - lastY) * 0.004)
        );
        lastX = e.clientX;
        lastY = e.clientY;
        applyCamera();
      }
      // hover raycast
      if (!raycastTargets || !points) return;
      const rect = el.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const rc = new THREE.Raycaster();
      rc.params.Points = { threshold: 1.4 };
      rc.setFromCamera(mouse, camera);
      const hits = rc.intersectObject(points);
      if (hits.length > 0 && starMeta.length > 0) {
        const idx = hits[0].index ?? 0;
        if (idx === hoverIdx && hoverIdx >= 0) {
          // same star — just update tooltip position
          setHover((h) => (h ? { ...h, sx: e.clientX - rect.left, sy: e.clientY - rect.top } : h));
          return;
        }
        hoverIdx = idx;
        const it = starMeta[idx];
        hoverUrl = it.sourceUrl || null;
        setHover({
          title: it.title,
          buyer: it.buyer,
          moneyText:
            typeof it.moneyWan === "number" && it.moneyWan > 0
              ? `${it.moneyWan} 万`
              : "金额未披露",
          stage: it.stageName || it.date,
          date: it.date,
          url: it.sourceUrl || null,
          sx: e.clientX - rect.left,
          sy: e.clientY - rect.top,
        });
      } else if (hoverIdx !== -1) {
        hoverIdx = -1;
        hoverUrl = null;
        setHover(null);
      }
    };
    const onUp = (e: PointerEvent) => {
      // click (not drag): open source of hovered star
      const movedTotal =
        Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY);
      el.style.cursor = "grab";
      dragging = false;
      if (movedTotal < 6 && hoverUrl) window.open(hoverUrl, "_blank");
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camState.dist = Math.min(110, Math.max(14, camState.dist + e.deltaY * 0.03));
      applyCamera();
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      const w2 = mount.clientWidth || W;
      const h2 = mount.clientHeight || H;
      renderer.setSize(w2, h2);
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      if (points) {
        (points.material as THREE.ShaderMaterial).uniforms.uScale.value = h2;
      }
    };
    window.addEventListener("resize", onResize);

    // ---------- loop: slow auto-orbit + twinkle ----------
    let raf = 0;
    const loop = () => {
      camState.yaw += 0.0011;
      applyCamera();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("wheel", onWheel);
      renderer.dispose();
      spriteTex.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    return (
      <div className="pagoda-wrap">
        <div className="pagoda-stage fluid-lab-fallback" style={{ height: 560 }}>
          <p>当前浏览器不支持 WebGL。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pagoda-wrap">
      <div className="pagoda-stage">
        <div ref={mountRef} className="pagoda-canvas" style={{ height: 560 }} />
        <div className="pagoda-badge">{status}</div>
        {hover && (
          <div
            ref={hoverRef}
            className="galaxy-tooltip"
            style={{
              left: Math.min(hover.sx + 16, (mountRef.current?.clientWidth ?? 800) - 320),
              top: hover.sy + 16,
            }}
          >
            <p className="galaxy-tooltip-title">{hover.title}</p>
            <p className="galaxy-tooltip-row">🏢 {hover.buyer}</p>
            <p className="galaxy-tooltip-row">💰 {hover.moneyText}</p>
            <p className="galaxy-tooltip-row">
              📅 {hover.date} · {hover.stage}
            </p>
            {hover.url && <p className="galaxy-tooltip-row galaxy-tooltip-link">点击跳转原文 ↗</p>}
          </div>
        )}
      </div>
      <div className="pagoda-controls">
        <span className="galaxy-legend">
          <i style={{ background: "#ffd166" }} /> 五星商机
          <i style={{ background: "#6fd6e8", marginLeft: 12 }} /> 四星
          <i style={{ background: "#e8e6df", marginLeft: 12 }} /> 三星
          <span style={{ marginLeft: 12, color: "var(--text-2)", fontSize: "0.75rem" }}>
            星的亮度 = 金额规模
          </span>
        </span>
      </div>
      <p className="pagoda-hint">拖拽环绕 · 滚轮缩放 · 悬停看标讯详情 · 点击跳转原文</p>
    </div>
  );
}
