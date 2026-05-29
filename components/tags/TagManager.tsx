"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/Button";

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export function TagManager() {
  const { isAuthenticated } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    const res = await fetch("/api/tags");
    if (res.ok) setTags(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const createTag = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      setNewName("");
      fetchTags();
    }
  };

  const deleteTag = async (id: string) => {
    const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (res.ok) fetchTags();
  };

  if (loading) return <div className="text-text-muted text-sm px-3 py-2">加载中...</div>;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1">标签</h3>

      {isAuthenticated && (
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createTag()}
            placeholder="新标签..."
            className="flex-1 glass-input rounded-lg px-3 py-1.5 text-sm text-text-primary"
          />
          <Button size="sm" onClick={createTag} disabled={!newName.trim()}>添加</Button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}44` }}
          >
            {tag.name}
            {isAuthenticated && (
              <button
                onClick={() => deleteTag(tag.id)}
                className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                title="删除标签"
              >
                x
              </button>
            )}
          </span>
        ))}
        {tags.length === 0 && (
          <p className="text-text-muted text-xs">暂无标签</p>
        )}
      </div>
    </div>
  );
}
