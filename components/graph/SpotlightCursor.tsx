// 鼠标跟随聚光灯光标效果（弹簧物理惯性）
// Direct copy from xingtu-demo

"use client";

import React, { useEffect, useRef } from 'react';

const SpotlightCursor: React.FC = () => {
  const outerRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 弹簧物理状态（外层大光晕延迟）
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let vx = 0;
    let vy = 0;
    let targetX = cx;
    let targetY = cy;
    let rafId = 0;

    const STIFFNESS = 0.10;
    const DAMPING = 0.78;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animate = () => {
      const dx = targetX - cx;
      const dy = targetY - cy;
      vx = (vx + dx * STIFFNESS) * DAMPING;
      vy = (vy + dy * STIFFNESS) * DAMPING;
      cx += vx;
      cy += vy;

      if (outerRef.current) {
        outerRef.current.style.left = `${cx}px`;
        outerRef.current.style.top = `${cy}px`;
      }
      if (midRef.current) {
        midRef.current.style.left = `${targetX}px`;
        midRef.current.style.top = `${targetY}px`;
      }
      if (dotRef.current) {
        dotRef.current.style.left = `${targetX}px`;
        dotRef.current.style.top = `${targetY}px`;
      }
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* 外层大光晕（弹簧延迟） */}
      <div
        ref={outerRef}
        className="spotlight-cursor"
        style={{
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(120,180,255,0.10) 0%, rgba(100,160,255,0.04) 40%, transparent 70%)',
          left: '-999px',
          top: '-999px',
        }}
      />
      {/* 中层光晕（精准跟随） */}
      <div
        ref={midRef}
        className="spotlight-cursor"
        style={{
          width: '70px',
          height: '70px',
          background: 'radial-gradient(circle, rgba(200,230,255,0.45) 0%, rgba(150,200,255,0.18) 40%, transparent 70%)',
          left: '-999px',
          top: '-999px',
        }}
      />
      {/* 核心高亮点 */}
      <div
        ref={dotRef}
        className="spotlight-cursor"
        style={{
          width: '6px',
          height: '6px',
          background: 'rgba(230,245,255,0.95)',
          boxShadow: '0 0 5px rgba(180,220,255,0.9), 0 0 10px rgba(100,180,255,0.6)',
          left: '-999px',
          top: '-999px',
        }}
      />
    </>
  );
};

export default SpotlightCursor;
