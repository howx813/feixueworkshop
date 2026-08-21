"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * 3D living room:
 * - soft global illumination + real PCF soft shadows
 * - procedurally painted oak floor (CanvasTexture, zero assets)
 * - wall-mounted TV playing an animated cat-and-mouse chase (CanvasTexture)
 * - orbit camera (drag / wheel)
 */

// ---------- procedural oak floor ----------
function paintOakFloor(size = 512): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext("2d")!;

  const PLANK_H = 64;
  const base = [178, 136, 92]; // oak
  for (let row = 0; row < size / PLANK_H; row++) {
    // per-plank hue variation
    const v = ((Math.sin(row * 12.9898) * 43758.5453) % 1 + 1) % 1;
    const tone = 0.86 + v * 0.24;
    ctx.fillStyle = `rgb(${base[0] * tone | 0},${base[1] * tone | 0},${base[2] * tone | 0})`;
    ctx.fillRect(0, row * PLANK_H, size, PLANK_H);

    // grain: wavy dark strokes
    ctx.strokeStyle = `rgba(120,84,50,${0.16 + v * 0.1})`;
    ctx.lineWidth = 1.2;
    for (let g = 0; g < 5; g++) {
      const gy = row * PLANK_H + 8 + g * 11 + v * 6;
      ctx.beginPath();
      for (let x = 0; x <= size; x += 8) {
        const wob = Math.sin(x * 0.05 + row * 7 + g * 3) * 2.4;
        if (x === 0) ctx.moveTo(x, gy + wob);
        else ctx.lineTo(x, gy + wob);
      }
      ctx.stroke();
    }
    // plank seam
    ctx.fillStyle = "rgba(70,48,28,0.55)";
    ctx.fillRect(0, row * PLANK_H, size, 2);
    // vertical butt joints (staggered)
    const jointX = ((row * 173) % 4) * (size / 4) + size / 8;
    ctx.fillRect(jointX, row * PLANK_H, 2, PLANK_H);
  }
  return cv;
}

// ---------- TV screen animation ----------
function createTvScreen() {
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 144;
  const ctx = cv.getContext("2d")!;
  const texture = new THREE.CanvasTexture(cv);
  texture.colorSpace = THREE.SRGBColorSpace;

  // chase paths: mouse leads, cat trails on the same ellipse
  const draw = (t: number) => {
    const W = cv.width;
    const H = cv.height;
    // cartoon living-room backdrop
    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, W, H * 0.55);
    ctx.fillStyle = "#98c268";
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
    ctx.fillStyle = "#e8d8a8";
    ctx.fillRect(W * 0.08, H * 0.18, W * 0.2, H * 0.3); // house wall
    ctx.fillStyle = "#c9a06a";
    ctx.beginPath();
    ctx.moveTo(W * 0.05, H * 0.2);
    ctx.lineTo(W * 0.18, H * 0.05);
    ctx.lineTo(W * 0.31, H * 0.2);
    ctx.closePath();
    ctx.fill();
    // sun
    ctx.fillStyle = "#ffd94a";
    ctx.beginPath();
    ctx.arc(W * 0.85, H * 0.14, 10, 0, Math.PI * 2);
    ctx.fill();

    const cx = W / 2;
    const cy = H * 0.62;
    const rx = W * 0.34;
    const ry = H * 0.2;

    // mouse (leads by ~0.5 rad)
    const ma = t * 1.6 + 0.5;
    const mx = cx + Math.cos(ma) * rx;
    const my = cy + Math.sin(ma) * ry;
    ctx.fillStyle = "#9aa0a8";
    ctx.beginPath();
    ctx.ellipse(mx, my, 9, 6, Math.cos(ma), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#b8bec6";
    ctx.beginPath();
    ctx.arc(mx + 7 * Math.cos(ma), my + 7 * Math.sin(ma) - 3, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#9aa0a8";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(mx - 8 * Math.cos(ma), my - 8 * Math.sin(ma));
    ctx.quadraticCurveTo(
      mx - 16 * Math.cos(ma),
      my - 14 * Math.sin(ma),
      mx - 12 * Math.cos(ma),
      my - 4 * Math.sin(ma)
    );
    ctx.stroke();

    // cat (chasing)
    const ca = t * 1.6;
    const kx = cx + Math.cos(ca) * rx;
    const ky = cy + Math.sin(ca) * ry;
    const dir = Math.cos(ca) >= 0 ? 1 : -1;
    ctx.fillStyle = "#e8934a";
    ctx.beginPath();
    ctx.ellipse(kx, ky, 13, 8.5, Math.cos(ca), 0, Math.PI * 2);
    ctx.fill();
    // ears
    ctx.beginPath();
    ctx.moveTo(kx + dir * 8, ky - 7);
    ctx.lineTo(kx + dir * 11, ky - 14);
    ctx.lineTo(kx + dir * 3, ky - 9);
    ctx.closePath();
    ctx.fill();
    // stripes
    ctx.strokeStyle = "#c4732e";
    ctx.lineWidth = 2;
    for (let s = -1; s <= 1; s++) {
      ctx.beginPath();
      ctx.moveTo(kx + s * 4, ky - 7);
      ctx.lineTo(kx + s * 4, ky - 2);
      ctx.stroke();
    }
    // tail
    ctx.strokeStyle = "#e8934a";
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(kx - dir * 12, ky);
    ctx.quadraticCurveTo(
      kx - dir * 22,
      ky - 10 - Math.sin(t * 6) * 4,
      kx - dir * 16,
      ky - 16
    );
    ctx.stroke();
    // eyes
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(kx + dir * 7, ky - 2, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // CRT-ish scanlines + vignette
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

    texture.needsUpdate = true;
  };

  return { texture, draw };
}

export default function LivingRoom3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRef = useRef(true);

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
    const H = mount.clientHeight || 520;
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x11141a);
    scene.fog = new THREE.Fog(0x11141a, 18, 34);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    const camState = { yaw: 0.5, pitch: 0.32, dist: 8.2 };
    const lookAt = new THREE.Vector3(0, 1.1, -0.5);

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

    // ---------- lights: soft global + real shadows ----------
    scene.add(new THREE.AmbientLight(0xbfd0e0, 0.28));
    scene.add(new THREE.HemisphereLight(0xcfd8e8, 0x3a3026, 0.22));

    const sun = new THREE.DirectionalLight(0xfff2dd, 1.15);
    sun.position.set(4.5, 5.5, 2.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -7;
    sun.shadow.camera.far = 25;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    scene.add(sun);

    const lamp = new THREE.PointLight(0xffc98a, 3.2, 7, 2);
    lamp.position.set(-3.1, 1.75, -1.6);
    lamp.castShadow = true;
    lamp.shadow.mapSize.set(1024, 1024);
    scene.add(lamp);

    // ---------- room shell ----------
    const ROOM_W = 8;
    const ROOM_D = 6;
    const ROOM_H = 3;

    const floorTex = new THREE.CanvasTexture(paintOakFloor());
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(2, 1.5);
    floorTex.colorSpace = THREE.SRGBColorSpace;
    floorTex.anisotropy = 8;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_W, ROOM_D),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8d8578, roughness: 0.95 });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), wallMat);
    backWall.position.set(0, ROOM_H / 2, -ROOM_D / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-ROOM_W / 2, ROOM_H / 2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_W, ROOM_D),
      new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 1 })
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = ROOM_H;
    scene.add(ceil);

    // baseboards
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0xf0ece2, roughness: 0.8 });
    const skirt1 = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.1, 0.04), skirtMat);
    skirt1.position.set(0, 0.05, -ROOM_D / 2 + 0.02);
    scene.add(skirt1);

    // window: glowing panel on the left wall + cool fill light
    const winMat = new THREE.MeshBasicMaterial({ color: 0xdfeaf5 });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.3), winMat);
    win.rotation.y = Math.PI / 2;
    win.position.set(-ROOM_W / 2 + 0.03, 1.7, -0.8);
    scene.add(win);
    const winFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 1.42, 1.72),
      new THREE.MeshStandardMaterial({ color: 0xf0ece2, roughness: 0.8 })
    );
    winFrame.position.set(-ROOM_W / 2 + 0.02, 1.7, -0.8);
    scene.add(winFrame);
    const winLight = new THREE.PointLight(0xcfe0f0, 2.2, 6, 2);
    winLight.position.set(-3.4, 1.8, -0.8);
    scene.add(winLight);

    // ---------- furniture ----------
    const box = (
      w: number,
      h: number,
      d: number,
      color: number,
      rough = 0.85
    ) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, roughness: rough })
      );
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    };

    // rug
    const rug = new THREE.Mesh(
      new THREE.CircleGeometry(1.9, 40),
      new THREE.MeshStandardMaterial({ color: 0x7a5c62, roughness: 1 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.012, -0.4);
    rug.receiveShadow = true;
    scene.add(rug);

    // sofa (facing the TV on the back wall)
    const sofaMat = 0x5d6e7f;
    const sofa = new THREE.Group();
    const seat = box(2.6, 0.45, 0.95, sofaMat, 0.9);
    seat.position.y = 0.42;
    const back = box(2.6, 0.75, 0.28, sofaMat, 0.9);
    back.position.set(0, 0.95, 0.36);
    const armL = box(0.3, 0.62, 0.95, sofaMat, 0.9);
    armL.position.set(-1.45, 0.5, 0);
    const armR = box(0.3, 0.62, 0.95, sofaMat, 0.9);
    armR.position.set(1.45, 0.5, 0);
    const cushion1 = box(1.15, 0.16, 0.8, 0x71839a, 0.95);
    cushion1.position.set(-0.62, 0.72, -0.02);
    const cushion2 = box(1.15, 0.16, 0.8, 0x71839a, 0.95);
    cushion2.position.set(0.62, 0.72, -0.02);
    sofa.add(seat, back, armL, armR, cushion1, cushion2);
    sofa.position.set(0, 0, 1.7);
    scene.add(sofa);

    // coffee table
    const table = new THREE.Group();
    const top = box(1.3, 0.07, 0.65, 0x8a6844, 0.5);
    top.position.y = 0.42;
    table.add(top);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x4c3a28, roughness: 0.7 });
    for (const [lx, lz] of [
      [-0.58, -0.26],
      [0.58, -0.26],
      [-0.58, 0.26],
      [0.58, 0.26],
    ]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.42, 12),
        legMat
      );
      leg.position.set(lx, 0.21, lz);
      leg.castShadow = true;
      table.add(leg);
    }
    // a small book on the table
    const book = box(0.32, 0.05, 0.22, 0xa04438, 0.6);
    book.position.set(-0.25, 0.49, 0.05);
    book.rotation.y = 0.3;
    table.add(book);
    table.position.set(0, 0, 0.15);
    scene.add(table);

    // TV console
    const console_ = box(2.1, 0.5, 0.45, 0x4a3b2e, 0.7);
    console_.position.set(0, 0.25, -ROOM_D / 2 + 0.35);
    scene.add(console_);

    // ---------- wall-mounted TV with animated screen ----------
    const tv = new THREE.Group();
    const frame = box(1.9, 1.1, 0.07, 0x14161a, 0.4);
    frame.position.y = 1.9;
    tv.add(frame);
    const { texture: screenTex, draw: drawScreen } = createTvScreen();
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.78, 0.98),
      new THREE.MeshBasicMaterial({ map: screenTex })
    );
    screen.position.set(0, 1.9, 0.045);
    tv.add(screen);
    // TV glow onto the room
    const tvLight = new THREE.PointLight(0x9fc4ff, 1.2, 4.5, 2);
    tvLight.position.set(0, 1.9, 0.5);
    tv.add(tvLight);
    tv.position.set(0, 0, -ROOM_D / 2 + 0.06);
    scene.add(tv);

    // floor lamp near sofa
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 1.6, 10),
      new THREE.MeshStandardMaterial({ color: 0x333940, roughness: 0.4, metalness: 0.6 })
    );
    pole.position.set(-3.1, 0.8, -1.6);
    pole.castShadow = true;
    scene.add(pole);
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.22, 0.32, 16, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xffd9a0,
        emissive: 0xffb45e,
        emissiveIntensity: 0.85,
        side: THREE.DoubleSide,
        roughness: 0.9,
      })
    );
    shade.position.set(-3.1, 1.72, -1.6);
    scene.add(shade);

    // plant in the corner
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.11, 0.26, 12),
      new THREE.MeshStandardMaterial({ color: 0xa66a4a, roughness: 0.9 })
    );
    pot.position.set(3.3, 0.13, -2.3);
    pot.castShadow = true;
    scene.add(pot);
    const plant = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.55 + Math.random() * 0.25, 6),
        new THREE.MeshStandardMaterial({ color: 0x4a7a3e, roughness: 0.9 })
      );
      const a = (i / 7) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.06, 0.45, Math.sin(a) * 0.06);
      leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
      leaf.castShadow = true;
      plant.add(leaf);
    }
    plant.position.set(3.3, 0.26, -2.3);
    scene.add(plant);

    setReady(true);

    // ---------- interaction ----------
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const el = renderer.domElement;
    el.style.touchAction = "none";
    el.style.cursor = "grab";

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      camState.yaw -= (e.clientX - lastX) * 0.0055;
      camState.pitch = Math.min(
        1.2,
        Math.max(0.05, camState.pitch + (e.clientY - lastY) * 0.004)
      );
      lastX = e.clientX;
      lastY = e.clientY;
      applyCamera();
    };
    const onUp = () => {
      dragging = false;
      el.style.cursor = "grab";
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camState.dist = Math.min(13, Math.max(4, camState.dist + e.deltaY * 0.005));
      applyCamera();
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      const w2 = mount.clientWidth || W;
      const h2 = mount.clientHeight || H;
      renderer.setSize(w2, h2);
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // ---------- loop: TV animation + gentle idle orbit ----------
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      drawScreen(t);
      if (autoRef.current && !dragging) {
        camState.yaw += 0.0016;
        applyCamera();
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // expose toggle
    (mount as unknown as { __toggleAuto?: () => void }).__toggleAuto = () => {
      autoRef.current = !autoRef.current;
      setAutoRotate(autoRef.current);
    };

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onUp);
      el.removeEventListener("wheel", onWheel);
      renderer.dispose();
      screenTex.dispose();
      floorTex.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  const toggleAuto = () => {
    const mount = mountRef.current as unknown as { __toggleAuto?: () => void } | null;
    mount?.__toggleAuto?.();
  };

  if (failed) {
    return (
      <div className="pagoda-wrap">
        <div className="pagoda-stage fluid-lab-fallback" style={{ height: 520 }}>
          <p>当前浏览器不支持 WebGL，无法渲染 3D 客厅。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pagoda-wrap">
      <div className="pagoda-stage">
        <div ref={mountRef} className="pagoda-canvas" style={{ height: 560 }} />
        <div className="pagoda-badge">three.js · 实时渲染</div>
      </div>
      <div className="pagoda-controls">
        <button onClick={toggleAuto} className="pagoda-btn">
          {autoRotate ? "暂停旋转" : "自动旋转"}
        </button>
      </div>
      <p className="pagoda-hint">
        柔和全局光照 + PCF 软阴影 · 程序生成橡木地板 · 电视播放猫鼠追逐 ·
        拖拽环绕 / 滚轮缩放
      </p>
      {ready ? null : <p className="pagoda-hint">初始化中…</p>}
    </div>
  );
}
