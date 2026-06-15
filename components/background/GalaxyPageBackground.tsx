// 星系页面背景 — 深海军蓝 + 蓝色星云 + 静态星光，匹配深空背景
"use client";

import React from 'react';

export default function GalaxyPageBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: '#010712' }}>
      {/* 蓝色星云 — 比例匹配参考图：大面积覆盖，底部最亮 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 40% at 45% 68%, rgba(15, 72, 116, 0.24) 0%, transparent 75%),
            radial-gradient(ellipse 60% 35% at 55% 72%, rgba(20, 80, 150, 0.20) 0%, transparent 72%),
            radial-gradient(ellipse 75% 45% at 50% 55%, rgba(31, 142, 207, 0.14) 0%, transparent 68%),
            radial-gradient(ellipse 38% 36% at 33% 66%, rgba(45, 160, 220, 0.20) 0%, transparent 62%),
            radial-gradient(ellipse 44% 32% at 49% 65%, rgba(60, 180, 240, 0.22) 0%, transparent 60%),
            radial-gradient(ellipse 38% 36% at 71% 62%, rgba(45, 160, 220, 0.20) 0%, transparent 62%),
            radial-gradient(ellipse 48% 28% at 50% 75%, rgba(7, 100, 180, 0.15) 0%, transparent 58%),
            radial-gradient(ellipse 28% 30% at 28% 72%, rgba(14, 162, 214, 0.14) 0%, transparent 55%),
            radial-gradient(ellipse 28% 30% at 76% 68%, rgba(14, 162, 214, 0.14) 0%, transparent 55%),
            radial-gradient(ellipse 30% 24% at 25% 58%, rgba(34, 211, 238, 0.10) 0%, transparent 52%),
            radial-gradient(ellipse 30% 24% at 78% 56%, rgba(34, 211, 238, 0.10) 0%, transparent 52%)
          `
        }}
      />
      {/* 密集静态星光 — 翻倍 */}
      <div className="absolute inset-0 opacity-40">
        {Array.from({ length: 240 }).map((_, i) => {
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
