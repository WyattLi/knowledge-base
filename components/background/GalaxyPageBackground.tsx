// 星系页面背景 — 深海军蓝 + 蓝色星云 + 静态星光，匹配深空背景
"use client";

import React from 'react';

export default function GalaxyPageBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: '#010712' }}>
      {/* 蓝色星云层 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 30% at 50% 40%, rgba(15, 72, 116, 0.18) 0%, transparent 70%),
            radial-gradient(ellipse 35% 25% at 55% 28%, rgba(31, 142, 207, 0.12) 0%, transparent 65%),
            radial-gradient(ellipse 25% 30% at 38% 48%, rgba(14, 162, 214, 0.10) 0%, transparent 60%),
            radial-gradient(ellipse 40% 20% at 50% 55%, rgba(7, 100, 180, 0.10) 0%, transparent 60%),
            radial-gradient(ellipse 20% 25% at 30% 32%, rgba(34, 211, 238, 0.08) 0%, transparent 55%),
            radial-gradient(ellipse 18% 28% at 68% 38%, rgba(45, 160, 220, 0.09) 0%, transparent 55%),
            radial-gradient(ellipse 30% 15% at 45% 62%, rgba(20, 80, 150, 0.08) 0%, transparent 55%),
            radial-gradient(ellipse 16% 30% at 55% 46%, rgba(60, 180, 240, 0.06) 0%, transparent 50%)
          `
        }}
      />
      {/* 密集静态星光 */}
      <div className="absolute inset-0 opacity-40">
        {Array.from({ length: 120 }).map((_, i) => {
          const x = ((i * 137 + 53) % 100);
          const y = ((i * 251 + 97) % 100);
          const size = ((i * 73) % 3) * 0.4 + 0.6;
          const alpha = ((i * 47) % 25) + 8;
          // 蓝白色调星星
          const isBlue = i % 5 === 0;
          const isCyan = i % 7 === 0;
          const color = isCyan ? `97,229,255` : isBlue ? `126,195,255` : `230,242,255`;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                background: `rgba(${color},0.${alpha})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
