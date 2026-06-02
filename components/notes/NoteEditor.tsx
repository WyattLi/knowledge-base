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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题"
          className="w-full glass-input rounded-xl px-4 py-3 text-lg font-medium text-text-primary placeholder:text-text-muted"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">分类</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full glass-input rounded-lg px-3 py-2 text-sm text-text-primary"
          >
            <option value="">无分类</option>
            {treeOptions.map(({ cat, depth }) => (
              <option key={cat.id} value={cat.id}>
                {"  ".repeat(depth)}{cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[150px]">
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">状态</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full glass-input rounded-lg px-3 py-2 text-sm text-text-primary"
          >
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="archived">已归档</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">标签</label>
        <div className="flex flex-wrap gap-1.5">
          {allTags.map(tag => (
            <button
              type="button"
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: selectedTags.includes(tag.id) ? tag.color + "33" : "transparent",
                color: selectedTags.includes(tag.id) ? tag.color : "var(--text-muted)",
                border: `1px solid ${selectedTags.includes(tag.id) ? tag.color + "66" : "var(--text-muted)"}22`,
              }}
            >
              {tag.name}
            </button>
          ))}
          {allTags.length === 0 && <span className="text-xs text-text-muted">暂无标签，请先在侧边栏创建</span>}
        </div>
      </div>

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Markdown 内容..."
          rows={20}
          className="w-full glass-input rounded-xl px-4 py-3 text-sm text-text-primary font-mono placeholder:text-text-muted resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "保存中..." : noteSlug ? "更新笔记" : "创建笔记"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>取消</Button>
      </div>
    </form>
  );
}
