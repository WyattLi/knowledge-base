// 深空背景 — 蓝色星云 + 密集星场，匹配参考图效果
"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

type StarColor = "white" | "blue" | "cyan" | "warm";

interface Star {
  x: number; y: number; r: number;
  opacity: number; twinkleSpeed: number; twinkleOffset: number;
  color: StarColor;
}

interface DriftStar extends Star {
  vx: number; vy: number;
}

interface Meteor {
  x: number; y: number; length: number; speed: number;
  opacity: number; delay: number; lastSpawn: number;
}

interface NebulaBlob {
  x: number; y: number; rx: number; ry: number;
  color: string; alpha: number; driftPhase: number;
}

const STAR_RGB: Record<StarColor, string> = {
  white: "230,242,255",
  blue: "126,195,255",
  cyan: "97,229,255",
  warm: "255,210,140",
};

function randomStarColor(): StarColor {
  const r = Math.random();
  if (r < 0.50) return "white";
  if (r < 0.80) return "blue";
  if (r < 0.95) return "cyan";
  return "warm";
}

// 蓝色星云配色 — 基于参考图 #0f2d4e → #225c88 → #81b0c3
const NEBULA_BLUES = [
  { color: "15, 72, 116", alpha: 0.11 },   // #0f4874
  { color: "31, 142, 207", alpha: 0.09 },  // #1f8ecf
  { color: "14, 162, 214", alpha: 0.08 },  // #0ea2d6
  { color: "7, 100, 180", alpha: 0.07 },   // #0764b4
  { color: "34, 211, 238", alpha: 0.06 },  // #22d3ee
  { color: "45, 160, 220", alpha: 0.10 },  // mid blue
  { color: "20, 80, 150", alpha: 0.08 },   // deep blue
  { color: "60, 180, 240", alpha: 0.05 },  // light blue
];

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0, height = 0, animId = 0;
    const farStars: Star[] = [];
    const nearStars: DriftStar[] = [];
    const meteors: Meteor[] = [];
    const nebulas: NebulaBlob[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      initElements();
    }

    function initElements() {
      farStars.length = 0;
      nearStars.length = 0;
      meteors.length = 0;
      nebulas.length = 0;

      // 密集星场 — 比 V1 多一倍
      const starCount = Math.max(1200, Math.floor((width * height) / 800));
      for (let i = 0; i < starCount; i++) {
        farStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.0 + 0.2,
          opacity: Math.random() * 0.65 + 0.20,
          twinkleSpeed: Math.random() * 0.0015 + 0.0005,
          twinkleOffset: Math.random() * Math.PI * 2,
          color: randomStarColor(),
        });
      }

      // 亮星+光晕 — 翻倍
      const brightCount = Math.max(220, Math.floor((width * height) / 5500));
      for (let i = 0; i < brightCount; i++) {
        nearStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.6 + 0.6,
          opacity: Math.random() * 0.50 + 0.35,
          twinkleSpeed: Math.random() * 0.0009 + 0.0003,
          twinkleOffset: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.04,
          vy: (Math.random() - 0.5) * 0.02,
          color: Math.random() < 0.7 ? "white" : Math.random() < 0.5 ? "blue" : "cyan",
        });
      }

      // 蓝色星云 — 比例匹配参考图：覆盖大部分画面，底部最亮
      // 底部宽星云带 — 覆盖全宽
      nebulas.push(
        { x: width * 0.45, y: height * 0.68, rx: width * 0.55, ry: height * 0.35, ...NEBULA_BLUES[0], driftPhase: 0 },
        { x: width * 0.55, y: height * 0.72, rx: width * 0.50, ry: height * 0.32, ...NEBULA_BLUES[6], driftPhase: 1.5 },
        { x: width * 0.50, y: height * 0.55, rx: width * 0.65, ry: height * 0.40, ...NEBULA_BLUES[1], driftPhase: 2.8 },
      );
      // 左亮斑 (33%, 68%) — 放大
      nebulas.push(
        { x: width * 0.33, y: height * 0.66, rx: width * 0.30, ry: height * 0.32, ...NEBULA_BLUES[5], driftPhase: 2.5 },
        { x: width * 0.28, y: height * 0.72, rx: width * 0.24, ry: height * 0.28, ...NEBULA_BLUES[2], driftPhase: 3.3 },
        { x: width * 0.25, y: height * 0.58, rx: width * 0.22, ry: height * 0.26, ...NEBULA_BLUES[4], driftPhase: 5.8 },
      );
      // 中亮斑 (49%, 67%) — 最亮最大
      nebulas.push(
        { x: width * 0.49, y: height * 0.65, rx: width * 0.36, ry: height * 0.30, ...NEBULA_BLUES[7], driftPhase: 4.0 },
        { x: width * 0.50, y: height * 0.75, rx: width * 0.40, ry: height * 0.24, ...NEBULA_BLUES[3], driftPhase: 5.2 },
        { x: width * 0.48, y: height * 0.56, rx: width * 0.28, ry: height * 0.22, ...NEBULA_BLUES[0], driftPhase: 1.0 },
      );
      // 右亮斑 (71%, 60%)
      nebulas.push(
        { x: width * 0.71, y: height * 0.62, rx: width * 0.30, ry: height * 0.32, ...NEBULA_BLUES[5], driftPhase: 1.8 },
        { x: width * 0.76, y: height * 0.68, rx: width * 0.24, ry: height * 0.28, ...NEBULA_BLUES[2], driftPhase: 4.5 },
        { x: width * 0.78, y: height * 0.56, rx: width * 0.22, ry: height * 0.26, ...NEBULA_BLUES[4], driftPhase: 6.3 },
      );

      // 流星
      for (let i = 0; i < 4; i++) {
        meteors.push({
          x: Math.random() * width * 1.4 + width * 0.1,
          y: Math.random() * height * 0.30,
          length: Math.random() * 80 + 70,
          speed: Math.random() * 2.0 + 1.5,
          opacity: Math.random() * 0.25 + 0.15,
          delay: Math.random() * 8000 + 5000,
          lastSpawn: performance.now(),
        });
      }
    }

    function drawEllipseGlow(
      ctx: CanvasRenderingContext2D,
      x: number, y: number, rx: number, ry: number,
      color: string, alpha: number,
    ) {
      const maxR = Math.max(rx, ry);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, maxR);
      grad.addColorStop(0, `rgba(${color},${alpha})`);
      grad.addColorStop(0.45, `rgba(${color},${alpha * 0.38})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.translate(x, y);
      if (rx !== ry) ctx.scale(rx / maxR, ry / maxR);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, maxR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, width, height);

      const dim = themeRef.current === "dark" ? 1 : 0.35;

      // 深空底色
      const bgGrad = ctx!.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, `rgba(1, 3, 14, ${dim})`);
      bgGrad.addColorStop(0.45, `rgba(3, 18, 42, ${dim})`);
      bgGrad.addColorStop(1, `rgba(1, 7, 24, ${dim})`);
      ctx!.fillStyle = bgGrad;
      ctx!.fillRect(0, 0, width, height);

      // 蓝色星云 — screen 叠加产生辉光混合
      ctx!.globalCompositeOperation = "screen";
      for (const n of nebulas) {
        const dx = Math.sin(time * 0.00007 + n.driftPhase) * 20;
        const dy = Math.cos(time * 0.00005 + n.driftPhase) * 14;
        drawEllipseGlow(ctx!, n.x + dx, n.y + dy, n.rx, n.ry, n.color, n.alpha * dim);
      }
      ctx!.globalCompositeOperation = "source-over";

      // 远景星
      for (const s of farStars) {
        const a = s.opacity * (0.70 + 0.30 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset)) * dim;
        ctx!.fillStyle = `rgba(${STAR_RGB[s.color]},${a.toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // 近景亮星 + 光晕
      for (const s of nearStars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        const a = s.opacity * (0.62 + 0.38 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset)) * dim;

        // 光晕
        const glow = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 7);
        glow.addColorStop(0, `rgba(${STAR_RGB[s.color]},${(a * 0.35).toFixed(3)})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r * 7, 0, Math.PI * 2);
        ctx!.fill();

        // 星核
        ctx!.fillStyle = `rgba(245,250,255,${a.toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r * 0.8, 0, Math.PI * 2);
        ctx!.fill();
      }

      // 流星
      for (const m of meteors) {
        if (time - m.lastSpawn > m.delay) {
          m.x = width + Math.random() * width * 0.3;
          m.y = Math.random() * height * 0.25;
          m.lastSpawn = time;
        }
        m.x -= m.speed;
        m.y += m.speed * 0.55;
        if (m.x < -200 || m.y > height * 0.7) {
          m.lastSpawn = time;
          m.x = width + Math.random() * 240;
          m.y = Math.random() * height * 0.22;
        }

        const grad = ctx!.createLinearGradient(m.x, m.y, m.x + m.length, m.y - m.length * 0.55);
        grad.addColorStop(0, `rgba(230, 250, 255, ${m.opacity * dim})`);
        grad.addColorStop(0.3, `rgba(112, 217, 255, ${m.opacity * 0.4 * dim})`);
        grad.addColorStop(1, "rgba(34, 211, 238, 0)");
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.0;
        ctx!.beginPath();
        ctx!.moveTo(m.x, m.y);
        ctx!.lineTo(m.x + m.length, m.y - m.length * 0.55);
        ctx!.stroke();
      }

      // 浅色主题遮罩
      if (themeRef.current === "light") {
        ctx!.fillStyle = "rgba(248, 247, 244, 0.65)";
        ctx!.fillRect(0, 0, width, height);
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    animId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}
