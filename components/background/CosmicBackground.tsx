"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
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

      // Far stars: static, dense, tiny
      for (let i = 0; i < 200; i++) {
        farStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.2 + 0.3,
          opacity: Math.random() * 0.6 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }

      // Near stars: drifting, larger
      for (let i = 0; i < 40; i++) {
        nearStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 2 + 0.8,
          opacity: Math.random() * 0.5 + 0.4,
          twinkleSpeed: Math.random() * 0.01 + 0.002,
          twinkleOffset: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
        });
      }

      // Meteors: occasional streaks
      for (let i = 0; i < 3; i++) {
        meteors.push({
          x: Math.random() * width * 1.5,
          y: Math.random() * height * 0.5,
          length: Math.random() * 100 + 60,
          speed: Math.random() * 4 + 2,
          opacity: Math.random() * 0.4 + 0.3,
          delay: Math.random() * 8000 + 2000,
          lastSpawn: performance.now(),
        });
      }
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, width, height);

      // Far stars (static twinkle)
      for (const s of farStars) {
        const alpha = s.opacity * (0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset));
        ctx!.fillStyle = `rgba(200,210,255,${alpha.toFixed(2)})`;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Near stars (drift + twinkle)
      for (const s of nearStars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        const alpha = s.opacity * (0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset));
        ctx!.fillStyle = `rgba(180,200,255,${alpha.toFixed(2)})`;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();

        // Subtle glow around brighter stars
        if (s.r > 1.5 && alpha > 0.6) {
          ctx!.fillStyle = `rgba(124,58,237,${(alpha * 0.15).toFixed(2)})`;
          ctx!.beginPath();
          ctx!.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx!.fill();
        }
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
        gradient.addColorStop(0, `rgba(255,255,255,${m.opacity.toFixed(2)})`);
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx!.strokeStyle = gradient;
        ctx!.lineWidth = 1;
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
