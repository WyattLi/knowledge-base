"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export function TagManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    const res = await fetch("/api/tags");
    if (res.ok) setTags(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  // Read all tagId params (supports multiple)
  const activeTagIds = searchParams.getAll("tagId");

  const toggleTag = (tagId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentIds = params.getAll("tagId");

    if (currentIds.includes(tagId)) {
      // Remove this tag
      params.delete("tagId");
      currentIds.filter(id => id !== tagId).forEach(id => params.append("tagId", id));
    } else {
      // Add this tag
      params.append("tagId", tagId);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
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
        {tags.map((tag) => {
          const isActive = activeTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-300 cursor-pointer"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${tag.color}30, ${tag.color}18)`
                  : `linear-gradient(135deg, ${tag.color}18, ${tag.color}0a)`,
                color: tag.color,
                border: isActive
                  ? `1px solid ${tag.color}88`
                  : `1px solid ${tag.color}33`,
                boxShadow: isActive
                  ? `0 0 12px ${tag.color}40, inset 0 0 6px ${tag.color}10`
                  : `0 0 8px ${tag.color}10`,
                transform: isActive ? "scale(1.05)" : "scale(1)",
              }}
            >
              <span
                className={`shrink-0 rounded-full transition-all duration-300 ${
                  isActive ? "w-1.5 h-1.5" : "w-1 h-1"
                }`}
                style={{
                  background: tag.color,
                  boxShadow: isActive
                    ? `0 0 6px ${tag.color}`
                    : `0 0 4px ${tag.color}80`,
                }}
              />
              {tag.name}
              {isActive && (
                <span className="text-[10px] opacity-70 ml-0.5">✕</span>
              )}
            </button>
          );
        })}
        {tags.length === 0 && (
          <p className="text-text-muted/70 text-xs px-1 py-2">暂无标签</p>
        )}
      </div>
    </div>
  );
}
