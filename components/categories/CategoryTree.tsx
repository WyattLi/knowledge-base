"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  children: Category[];
}

export function CategoryTree() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  if (loading) return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="w-3 h-3 rounded-full bg-nebula-purple/30 animate-pulse" />
      <span className="text-text-muted text-sm">加载中...</span>
    </div>
  );

  return (
    <div className="space-y-0.5">
      <h3 className="text-[11px] font-semibold text-nebula-purple/80 uppercase tracking-[0.1em] px-1 mb-3">
        &#x25C6; 分类
      </h3>

      {categories.map((cat) => (
        <CategoryNode key={cat.id} category={cat} onSelect={(c) => router.push(`/notes?categoryId=${c.id}`)} depth={0} />
      ))}
      {categories.length === 0 && (
        <p className="text-text-muted/70 text-xs px-2 py-4 text-center">暂无分类</p>
      )}
    </div>
  );
}

function CategoryNode({ category, onSelect, depth }: { category: Category; onSelect?: (cat: Category) => void; depth: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (category.children || []).length > 0;

  return (
    <div className="relative">
      {/* Connector line to parent */}
      {depth > 0 && (
        <span
          className="absolute border-l border-nebula-purple/10 group-hover:border-nebula-purple/25 transition-colors"
          style={{
            left: `${depth * 14 - 1}px`,
            top: 0,
            height: "100%",
          }}
        />
      )}

      <button
        onClick={() => onSelect?.(category)}
        className="group flex items-center gap-1.5 w-full text-left py-1.5 rounded-md transition-all duration-200"
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <span
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full transition-all duration-300"
            style={{
              background: expanded ? "rgba(139,92,246,0.15)" : "transparent",
              boxShadow: expanded ? "0 0 6px rgba(139,92,246,0.2)" : "none",
            }}
          >
            <span className={`text-[8px] transition-transform duration-300 ${expanded ? "text-nebula-purple/70 rotate-0" : "text-text-muted/70 -rotate-90"}`}>
              &#x25BC;
            </span>
          </span>
        ) : (
          <span className="shrink-0 w-3.5 flex justify-center">
            <span className="w-1 h-1 rounded-full bg-nebula-purple/20 group-hover:bg-nebula-purple/50 group-hover:shadow-[0_0_4px_rgba(139,92,246,0.5)] transition-all duration-300" />
          </span>
        )}

        <span className={`text-sm truncate transition-all duration-200 ${
          hasChildren
            ? "text-text-primary/90 font-medium"
            : "text-text-secondary/80 group-hover:text-text-primary"
        }`}>
          {category.name}
        </span>

        {hasChildren && (
          <span className="ml-auto text-[10px] text-text-muted/30 group-hover:text-text-muted/50 transition-colors">
            {(category.children || []).length}
          </span>
        )}
      </button>

      {expanded && hasChildren && category.children!.map((child) => (
        <CategoryNode key={child.id} category={child} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
}
