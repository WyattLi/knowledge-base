// 星系分类图例组件 — 照搬 xingtu-demo 样式，数据驱动
"use client";

import React from 'react';

export interface CategoryLegendEntry {
  core: string;    // hex color
  glow: string;    // glow color (for boxShadow)
  label: string;   // display name
  count: number;   // node count
}

interface CategoryLegendProps {
  entries: CategoryLegendEntry[];
  activeEntry: string | null;   // active core color hex, or null
  onFilter: (core: string | null) => void;
}

const CategoryLegend: React.FC<CategoryLegendProps> = ({
  entries,
  activeEntry,
  onFilter,
}) => {
  if (entries.length === 0) return null;

  return (
    <div className="absolute left-5 bottom-5 md:left-6 md:bottom-6 z-40">
      <div
        className="rounded-xl p-3 md:p-4 space-y-2"
        style={{
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 0 20px rgba(80,120,255,0.08), 0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div className="text-xs text-white/30 mb-2 font-medium tracking-wider uppercase">
          知识分类
        </div>
        {entries.map((entry) => {
          const isActive = activeEntry === entry.core;
          return (
            <button
              key={entry.core}
              onClick={() => onFilter(isActive ? null : entry.core)}
              className="flex items-center gap-2.5 w-full group hover:opacity-100 transition-opacity"
              style={{ opacity: activeEntry && !isActive ? 0.35 : 1 }}
            >
              {/* 星星指示器 */}
              <div className="relative shrink-0 w-4 h-4 flex items-center justify-center">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: entry.core,
                    boxShadow: isActive
                      ? `0 0 6px ${entry.glow}, 0 0 12px ${entry.glow}`
                      : `0 0 4px ${entry.glow}`,
                  }}
                />
              </div>
              <span
                className="text-xs min-w-0 text-left leading-none"
                style={{ color: isActive ? entry.core : 'rgba(255,255,255,0.6)' }}
              >
                {entry.label}
              </span>
              <span className="text-xs ml-auto pl-2 text-white/25">{entry.count}</span>
            </button>
          );
        })}

        {/* 全部显示 */}
        {activeEntry && (
          <button
            onClick={() => onFilter(null)}
            className="w-full mt-1 pt-2 border-t border-white/8 text-xs text-white/35 hover:text-white/60 transition-colors text-left"
          >
            ↩ 显示全部
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryLegend;
