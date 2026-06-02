"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthContext";

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export function TagManager() {
  const { isAuthenticated } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    const res = await fetch("/api/tags");
    if (res.ok) setTags(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const deleteTag = async (id: string) => {
    const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (res.ok) fetchTags();
  };

  if (loading) return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="w-3 h-3 rounded-full bg-nebula-cyan/30 animate-pulse" />
      <span className="text-text-muted text-sm">加载中...</span>
    </div>
  );

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-semibold text-nebula-cyan/80 uppercase tracking-[0.1em] px-1">
        &#x2726; 标签
      </h3>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-300 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${tag.color}18, ${tag.color}0a)`,
              color: tag.color,
              border: `1px solid ${tag.color}33`,
              boxShadow: `0 0 8px ${tag.color}10`,
            }}
          >
            <span
              className="w-1 h-1 rounded-full shrink-0"
              style={{ background: tag.color, boxShadow: `0 0 4px ${tag.color}` }}
            />
            {tag.name}
            {isAuthenticated && (
              <button
                onClick={() => deleteTag(tag.id)}
                className="ml-0.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-[10px]"
                title="删除标签"
              >
                &#x2715;
              </button>
            )}
          </span>
        ))}
        {tags.length === 0 && (
          <p className="text-text-muted/70 text-xs px-1 py-2">暂无标签</p>
        )}
      </div>
    </div>
  );
}
