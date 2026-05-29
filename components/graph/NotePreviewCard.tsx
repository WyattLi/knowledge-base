"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { GraphNode } from "./types";

interface NotePreviewCardProps {
  node: GraphNode;
  screenPos: { x: number; y: number };
  onClose: () => void;
}

export function NotePreviewCard({ node, screenPos, onClose }: NotePreviewCardProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 glass rounded-xl p-5 w-72 shadow-[0_0_30px_rgba(139,92,246,0.2)]"
        style={{
          left: screenPos.x,
          top: screenPos.y,
          transform: "translate(-50%, -50%)",
        }}
      >
        <h3 className="text-lg font-semibold text-star-white mb-2">{node.title}</h3>
        {node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {node.tags.map(tag => (
              <span
                key={tag.id}
                className="px-2 py-0.5 text-xs rounded-full"
                style={{ backgroundColor: tag.color + "20", color: tag.color, border: `1px solid ${tag.color}40` }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-4 text-xs text-text-muted mb-4">
          <span>{node.citationCount} 引用</span>
          <span>{node.wordCount} 字</span>
        </div>
        <Link
          href={`/notes/${node.slug}`}
          className="inline-block text-sm text-nebula-purple hover:text-nebula-cyan transition-colors"
        >
          查看笔记 &rarr;
        </Link>
      </div>
    </>
  );
}
