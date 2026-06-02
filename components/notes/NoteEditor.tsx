"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { flatCategories as flattenTree } from "@/lib/category-tree";

interface Tag { id: string; name: string; slug: string; color: string; }
interface Category { id: string; name: string; slug: string; children: Category[]; }

interface NoteData {
  title: string;
  content: string;
  categoryId: string;
  status: string;
  tagIds: string[];
}

export function NoteEditor({ initialData, noteSlug }: { initialData?: Partial<NoteData>; noteSlug?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [status, setStatus] = useState(initialData?.status || "published");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tagIds || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/tags").then(r => r.json()).then(setAllTags);
    fetch("/api/categories").then(r => r.json()).then(setAllCategories);
  }, []);

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("标题和内容不能为空");
      return;
    }
    setSaving(true);
    setError("");

    const url = noteSlug ? `/api/notes/${noteSlug}` : "/api/notes";
    const method = noteSlug ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), content: content.trim(), categoryId: categoryId || null, status, tagIds: selectedTags }),
    });

    if (res.ok) {
      const note = await res.json();
      router.push(`/notes/${note.slug}`);
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error || "保存失败");
      setSaving(false);
    }
  };

  const treeOptions = flattenTree(allCategories).map(c => ({ cat: c, depth: c.depth }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {error && (
        <div className="shrink-0 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Header: title + meta + actions */}
      <div className="shrink-0 space-y-4 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题"
          className="w-full glass rounded-xl px-4 py-2.5 text-lg font-medium text-text-primary placeholder:text-text-muted focus:outline-none"
        />

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2 items-center">
            <label className="text-xs text-text-muted">分类</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="glass rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
            >
              <option value="">无</option>
              {treeOptions.map(({ cat, depth }) => (
                <option key={cat.id} value={cat.id}>
                  {"  ".repeat(depth)}{cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <label className="text-xs text-text-muted">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="glass rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
            >
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
          </div>

          <div className="flex-1 flex justify-end gap-2">
            <Button type="submit" disabled={saving} size="sm">
              {saving ? "保存中..." : noteSlug ? "更新" : "创建"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>取消</Button>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="shrink-0 mb-3">
        <div className="flex flex-wrap gap-1">
          {allTags.map(tag => (
            <button
              type="button"
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className="px-2 py-0.5 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: selectedTags.includes(tag.id) ? tag.color + "33" : "transparent",
                color: selectedTags.includes(tag.id) ? tag.color : "var(--text-muted)",
                border: `1px solid ${selectedTags.includes(tag.id) ? tag.color + "66" : "var(--text-muted)"}22`,
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content: fills remaining space */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Markdown 内容..."
        className="flex-1 w-full glass rounded-xl p-4 text-sm text-text-primary font-mono placeholder:text-text-muted resize-none focus:outline-none min-h-[300px]"
      />
    </form>
  );
}
