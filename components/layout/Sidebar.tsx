"use client";

import { CategoryTree } from "@/components/categories/CategoryTree";
import { TagManager } from "@/components/tags/TagManager";

export function Sidebar() {
  return (
    <aside className="relative z-20 w-56 shrink-0 glass border-r border-white/5 p-4 space-y-6 overflow-y-auto">
      <CategoryTree />
      <TagManager />
    </aside>
  );
}
