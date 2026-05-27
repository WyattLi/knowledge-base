"use client";

import { useEffect, useRef } from "react";

type StarColor = "white" | "purple" | "cyan" | "gold";

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: StarColor;
}

interface DriftStar extends Star {
  vx: number;
  vy: number;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  delay: number;
  lastSpawn: number;
}

interface Nebula {
  x: number;
  y: number;
  r: number;
  color: string;
  alpha: number;
}

const STAR_COLORS: Record<StarColor, string> = {
  white: "200,210,255",
  purple: "180,160,240",
  cyan: "160,220,240",
  gold: "250,220,180",
};

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationId: number;
    const farStars: Star[] = [];
    const nearStars: DriftStar[] = [];
    const meteors: Meteor[] = [];
    const nebulas: Nebula[] = [];

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width;
      canvas!.height = height;
      initStars();
    }

    function initStars() {
      farStars.length = 0;
      nearStars.length = 0;
      meteors.length = 0;
      nebulas.length = 0;

      // Nebula glows: soft purple/violet ambient patches
      const nebulaColors = [
        "139,92,246",   // purple
        "99,102,241",   // indigo
        "34,211,238",   // cyan
        "168,85,247",   // violet
      ];
      for (let i = 0; i < 5; i++) {
        nebulas.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 400 + 200,
          color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
          alpha: Math.random() * 0.04 + 0.02,
        });
      }

      // Far stars: static, dense, tiny, varied colors
      for (let i = 0; i < 250; i++) {
        farStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.2 + 0.3,
          opacity: Math.random() * 0.7 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleOffset: Math.random() * Math.PI * 2,
          color: randomColor(),
        });
      }

      // Near stars: drifting, larger, more colorful
      for (let i = 0; i < 60; i++) {
        nearStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 2.5 + 0.8,
          opacity: Math.random() * 0.6 + 0.3,
          twinkleSpeed: Math.random() * 0.008 + 0.002,
          twinkleOffset: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          color: randomColor(),
        });
      }

      // Meteors: occasional streaks
      for (let i = 0; i < 4; i++) {
        meteors.push({
          x: Math.random() * width * 1.5,
          y: Math.random() * height * 0.5,
          length: Math.random() * 120 + 80,
          speed: Math.random() * 3 + 2,
          opacity: Math.random() * 0.5 + 0.3,
          delay: Math.random() * 8000 + 3000,
          lastSpawn: performance.now(),
        });
      }
    }

    function randomColor(): StarColor {
      const colors: StarColor[] = ["white", "white", "white", "purple", "cyan", "gold"];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, width, height);

      // Nebula glows: soft ambient patches of colored light
      for (const n of nebulas) {
        const gradient = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        gradient.addColorStop(0, `rgba(${n.color},${n.alpha.toFixed(3)})`);
        gradient.addColorStop(0.5, `rgba(${n.color},${(n.alpha * 0.5).toFixed(3)})`);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.fillStyle = gradient;
        ctx!.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
      }

      // Far stars (static twinkle, varied colors)
      for (const s of farStars) {
        const alpha = s.opacity * (0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset));
        ctx!.fillStyle = `rgba(${STAR_COLORS[s.color]},${alpha.toFixed(2)})`;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Near stars (drift + twinkle + glow halos)
      for (const s of nearStars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        const alpha = s.opacity * (0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset));

        // Glow halo (larger radius, lower opacity)
        if (s.r > 1.2 && alpha > 0.5) {
          const haloGradient = ctx!.createRadialGradient(s.x, s.y, s.r * 0.5, s.x, s.y, s.r * 5);
          haloGradient.addColorStop(0, `rgba(${STAR_COLORS[s.color]},${(alpha * 0.2).toFixed(2)})`);
          haloGradient.addColorStop(1, "rgba(0,0,0,0)");
          ctx!.fillStyle = haloGradient;
          ctx!.beginPath();
          ctx!.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
          ctx!.fill();
        }

        // Star core
        const coreGradient = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        coreGradient.addColorStop(0, `rgba(255,255,255,${alpha.toFixed(2)})`);
        coreGradient.addColorStop(0.3, `rgba(${STAR_COLORS[s.color]},${alpha.toFixed(2)})`);
        coreGradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.fillStyle = coreGradient;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Meteors
      for (const m of meteors) {
        if (time - m.lastSpawn > m.delay) {
          m.x = Math.random() * width * 1.2 + 200;
          m.y = Math.random() * height * 0.3;
          m.lastSpawn = time;
        }
        m.x -= m.speed;
        m.y += m.speed * 0.7;

        if (m.x < -200 || m.y > height + 200) {
          m.lastSpawn = time;
          m.x = width + Math.random() * 300;
          m.y = Math.random() * height * 0.3;
        }

        const gradient = ctx!.createLinearGradient(m.x, m.y, m.x + m.length, m.y - m.length * 0.7);
        gradient.addColorStop(0, `rgba(255,240,255,${m.opacity.toFixed(2)})`);
        gradient.addColorStop(0.3, `rgba(180,160,240,${(m.opacity * 0.6).toFixed(2)})`);
        gradient.addColorStop(1, "rgba(139,92,246,0)");
        ctx!.strokeStyle = gradient;
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        ctx!.moveTo(m.x, m.y);
        ctx!.lineTo(m.x + m.length, m.y - m.length * 0.7);
        ctx!.stroke();
      }

      animationId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
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
