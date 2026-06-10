// 知识节点详情浮层组件 — 照搬 xingtu-demo 的星空玻璃主题
"use client";

import React from 'react';
import Link from 'next/link';
import { X, Tag, Layers, ArrowUpRight } from 'lucide-react';
import type { GraphNode } from './types';

interface Props {
  node: GraphNode | null;
  onClose: () => void;
}

function getCategoryInfo(node: GraphNode): { core: string; glow: string; label: string } {
  if (node.tags.length > 0) {
    const c = node.tags[0].color;
    return { core: c, glow: c + 'CC', label: node.tags[0].name };
  }
  return { core: '#64b8ff', glow: 'rgba(100, 184, 255, 0.8)', label: '知识' };
}

function importanceFromLinkCount(linkCount: number): number {
  return Math.min(5, Math.max(1, Math.ceil(linkCount / 2)));
}

const NoteDetailPanel: React.FC<Props> = ({ node, onClose }) => {
  if (!node) return null;

  const colors = getCategoryInfo(node);
  const importance = importanceFromLinkCount(node.linkCount);

  return (
    <div
      className="node-detail-panel fixed z-50 w-80 md:w-96 rounded-xl p-5 select-none"
      style={{
        right: '24px',
        bottom: '24px',
        maxWidth: 'calc(100vw - 48px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 顶部光效线 */}
      <div
        className="absolute top-0 left-0 right-0 h-px rounded-t-xl"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.core}, transparent)`,
        }}
      />

      {/* 标题行 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* 星星指示器 */}
          <div
            className="shrink-0 w-3 h-3 rounded-full"
            style={{
              background: colors.core,
              boxShadow: `0 0 8px ${colors.glow}, 0 0 16px ${colors.glow}`,
            }}
          />
          <h3
            className="text-base font-semibold text-balance leading-tight"
            style={{ color: colors.core }}
          >
            {node.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
          aria-label="关闭详情"
        >
          <X size={14} />
        </button>
      </div>

      {/* 分类与重要程度 */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            background: `${colors.core}18`,
            border: `1px solid ${colors.core}40`,
            color: colors.core,
          }}
        >
          <Layers size={10} />
          {colors.label}
        </div>
        {/* 重要程度星级 */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: i < importance ? colors.core : 'rgba(255,255,255,0.1)',
                boxShadow: i < importance ? `0 0 4px ${colors.glow}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* 分割线 */}
      <div
        className="h-px mb-3"
        style={{ background: `linear-gradient(90deg, ${colors.core}30, transparent)` }}
      />

      {/* 摘要 */}
      <p className="text-sm text-white/65 leading-relaxed text-pretty mb-4">
        {node.summary || '暂无摘要'}
      </p>

      {/* 标签 */}
      {node.tags.length > 0 && (
        <div className="flex items-start gap-2">
          <Tag size={12} className="mt-0.5 shrink-0 text-white/30" />
          <div className="flex flex-wrap gap-1.5">
            {node.tags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-2 py-0.5 rounded-md"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 关联节点数量 */}
      {node.linkCount > 0 && (
        <div className="mt-3 pt-3 border-t border-white/8 flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: colors.core }}
          />
          <span className="text-xs text-white/35">
            已连接 {node.linkCount} 个知识节点
          </span>
        </div>
      )}

      {/* 查看详情链接 */}
      <div className="mt-3 pt-3 border-t border-white/8">
        <Link
          href={`/notes/${node.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: colors.core }}
        >
          查看完整笔记
          <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  );
};

export { NoteDetailPanel };
