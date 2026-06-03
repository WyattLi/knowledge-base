"use client";

import { CategoryTree } from "@/components/categories/CategoryTree";
import { TagManager } from "@/components/tags/TagManager";

export function Sidebar() {
  return (
    <aside className="relative z-20 w-56 shrink-0 border-r border-[var(--border-subtle)] p-4 space-y-6 overflow-y-auto"
      style={{
        background: "var(--bg-elevated)",
      }}
    >
      <CategoryTree />
      <div className="border-t border-[var(--border-subtle)] pt-4">
        <TagManager />
      </div>
    </aside>
  );
}
