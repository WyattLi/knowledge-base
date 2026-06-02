"use client";

import { CategoryTree } from "@/components/categories/CategoryTree";
import { TagManager } from "@/components/tags/TagManager";

export function Sidebar() {
  return (
    <aside className="relative z-20 w-56 shrink-0 border-r border-nebula-purple/10 p-4 space-y-6 overflow-y-auto"
      style={{
        background: "linear-gradient(180deg, rgba(139,92,246,0.02) 0%, transparent 30%, transparent 70%, rgba(34,211,238,0.02) 100%)",
      }}
    >
      <CategoryTree />
      <div className="border-t border-nebula-purple/10 pt-4">
        <TagManager />
      </div>
    </aside>
  );
}
