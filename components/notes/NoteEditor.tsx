"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { flatCategories as flattenTree } from "@/lib/category-tree";
import { AiSuggestPanel } from "./AiSuggestPanel";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { EditorToolbar } from "./EditorToolbar";

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
  const [aiOpen, setAiOpen] = useState(false);
  const [splitMode, setSplitMode] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Paste image support
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItem = Array.from(items).find(item => item.type.startsWith("image/"));
    if (!imageItem) return;

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;

    setUploading(true);

    // Capture cursor position BEFORE async operation
    const ta = editorRef.current;
    const before = ta ? ta.value.slice(0, ta.selectionStart) : "";
    const after = ta ? ta.value.slice(ta.selectionEnd) : "";

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        const md = `\n![图片](${data.url})\n`;
        setContent(before + md + after);
        // Restore cursor after the inserted image
        setTimeout(() => {
          const ta = editorRef.current;
          if (ta) {
            const pos = before.length + md.length;
            ta.focus();
            ta.setSelectionRange(pos, pos);
          }
        }, 50);
      }
    } catch (err) {
      console.warn("Image paste failed:", err);
    }
    setUploading(false);
  }, []);

  useEffect(() => {
    fetch("/api/tags").then(r => r.json()).then(setAllTags);
    fetch("/api/categories").then(r => r.json()).then(setAllCategories);
  }, []);

  // Sync scroll between editor and preview
  const handleEditorScroll = useCallback(() => {
    if (!splitMode || !editorRef.current || !previewRef.current) return;
    const ratio = editorRef.current.scrollTop / (editorRef.current.scrollHeight - editorRef.current.clientHeight);
    if (isFinite(ratio)) {
      const preview = previewRef.current;
      preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    }
  }, [splitMode]);

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

      {/* Header */}
      <div className="shrink-0 space-y-4 mb-3">
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

          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setSplitMode(!splitMode)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                splitMode ? "text-text-primary" : "text-text-secondary hover:text-text-primary hover:bg-[var(--surface-hover)]"
              }`}
            >
              {splitMode ? "分栏" : "纯编辑"}
            </button>
          </div>

          <div className="flex-1 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!title.trim() || !content.trim()}
              onClick={() => setAiOpen(true)}
            >
              AI 联想
            </Button>
            <Button type="submit" disabled={saving} variant="ghost" size="sm">
              {saving ? "保存中..." : noteSlug ? "更新" : "创建"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>取消</Button>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="shrink-0 mb-2">
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

      {/* Toolbar */}
      {uploading && (
        <div className="shrink-0 text-xs text-nebula-cyan/60 px-2">图片上传中...</div>
      )}
      <div className="shrink-0">
        <EditorToolbar
          editorRef={editorRef}
          onInsert={(text) => setContent(text)}
          onImageUploading={setUploading}
        />
      </div>

      {/* Content area */}
      {splitMode ? (
        <div className="flex-1 flex gap-3 min-h-0">
          {/* Editor pane */}
          <textarea
            ref={editorRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onScroll={handleEditorScroll}
            onPaste={handlePaste}
            placeholder="Markdown 内容..."
            className="flex-1 glass rounded-xl p-4 text-sm text-text-primary font-mono placeholder:text-text-muted resize-none focus:outline-none overflow-y-auto"
          />
          {/* Preview pane */}
          <div
            ref={previewRef}
            className="flex-1 glass rounded-xl p-6 overflow-y-auto"
          >
            {content.trim() ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-text-muted/40 text-sm text-center mt-20">预览将显示在这里</p>
            )}
          </div>
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Markdown 内容..."
          className="flex-1 w-full glass rounded-xl p-4 text-sm text-text-primary font-mono placeholder:text-text-muted resize-none focus:outline-none"
        />
      )}

      <AiSuggestPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title={title}
        content={content}
        noteSlug={noteSlug}
        onConfirm={(slugs) => {
          const links = slugs.map(s => `- [[${s}]]`).join("\n");
          setContent(prev => prev.trimEnd() + `\n\n## 相关笔记\n\n${links}\n`);
        }}
      />
    </form>
  );
}
