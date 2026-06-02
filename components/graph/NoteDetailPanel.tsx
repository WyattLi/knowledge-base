"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/notes/MarkdownRenderer";
import type { GraphNode } from "./types";

interface Props {
  node: GraphNode;
  onClose: () => void;
}

export function NoteDetailPanel({ node, onClose }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/notes/${node.slug}`)
      .then(r => r.json())
      .then(d => setContent(d.content || ""))
      .finally(() => setLoading(false));
  }, [node.slug]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[840px] max-w-[60vw] z-20 glass border-l border-white/10 overflow-y-auto shadow-[-4px_0_30px_rgba(0,0,0,0.5)]">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-text-muted hover:text-text-primary text-lg transition-colors"
      >
        &times;
      </button>

      <div className="p-6">
        {/* Title */}
        <h2 className="text-xl font-bold text-text-primary mb-2 pr-6">{node.title}</h2>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
          <span>{node.wordCount} 字</span>
          <span>{node.citationCount} 引用</span>
        </div>

        {/* Tags */}
        {node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {node.tags.map(tag => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{ backgroundColor: tag.color + "18", color: tag.color, border: `1px solid ${tag.color}33` }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-white/10 mb-4" />

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-4 h-4 rounded-full border-2 border-nebula-purple/30 border-t-nebula-purple animate-spin" />
          </div>
        ) : content ? (
          <div className="text-sm leading-relaxed">
            <MarkdownRenderer content={content} />
          </div>
        ) : (
          <p className="text-text-muted text-sm py-4">暂无内容</p>
        )}

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <Link
            href={`/notes/${node.slug}`}
            className="inline-block text-sm text-nebula-purple hover:text-nebula-cyan transition-colors"
          >
            在独立页面打开 &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
