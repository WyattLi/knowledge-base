// 星系页面背景 — 纯黑 + 静态星云渐变，匹配星图风格
"use client";

import React from 'react';

export default function GalaxyPageBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: '#000000' }}>
      {/* 星云层 — 静态径向渐变，模拟 GalaxyCanvas 的 nebula 效果 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 600px 400px at 30% 40%, rgba(40,60,160,0.07) 0%, transparent 100%),
            radial-gradient(ellipse 500px 350px at 65% 35%, rgba(80,20,140,0.06) 0%, transparent 100%),
            radial-gradient(ellipse 700px 450px at 50% 60%, rgba(20,80,120,0.05) 0%, transparent 100%),
            radial-gradient(ellipse 400px 300px at 15% 70%, rgba(60,30,100,0.06) 0%, transparent 100%),
            radial-gradient(ellipse 450px 320px at 80% 70%, rgba(30,60,80,0.06) 0%, transparent 100%)
          `
        }}
      />
      {/* 微弱的随机星光点 — 用 CSS 实现几十颗静态星星 */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 40 }).map((_, i) => {
          const x = ((i * 137 + 53) % 100);
          const y = ((i * 251 + 97) % 100);
          const size = ((i * 73) % 3) + 1;
          const alpha = ((i * 47) % 30) + 10;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                background: `rgba(200,220,255,0.${alpha})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
