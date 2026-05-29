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

  if (loading) return <div className="text-text-muted text-sm px-3 py-2">加载中...</div>;

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1 mb-2">分类</h3>
      {categories.map((cat) => (
        <CategoryNode key={cat.id} category={cat} onSelect={(c) => router.push(`/notes?categoryId=${c.id}`)} depth={0} />
      ))}
      {categories.length === 0 && (
        <p className="text-text-muted text-xs px-1">暂无分类</p>
      )}
    </div>
  );
}

function CategoryNode({ category, onSelect, depth }: { category: Category; onSelect?: (cat: Category) => void; depth: number }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <button
        onClick={() => onSelect?.(category)}
        className="flex items-center gap-1.5 w-full text-left px-1 py-1.5 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {category.children.length > 0 && (
          <span
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="text-text-muted text-xs w-4"
          >
            {expanded ? "v" : ">"}
          </span>
        )}
        {category.children.length === 0 && <span className="w-4" />}
        <span>{category.name}</span>
      </button>
      {expanded && category.children.map((child) => (
        <CategoryNode key={child.id} category={child} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
}
