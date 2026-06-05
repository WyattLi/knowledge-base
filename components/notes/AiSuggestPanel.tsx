"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";

interface Suggestion {
  slug: string;
  title: string;
  reason: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (slugs: string[]) => void;
  title: string;
  content: string;
  noteSlug?: string;
  summary?: string;
  onSummaryGenerated?: (summary: string) => void;
  existingSlugs?: string[];
}

export function AiSuggestPanel({ open, onClose, onConfirm, title, content, noteSlug, summary: providedSummary, onSummaryGenerated, existingSlugs }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          excludeSlug: noteSlug || undefined,
          summary: providedSummary?.trim() || undefined,
          existingSlugs: existingSlugs || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuggestions(data.suggestions || []);
        setSelected(new Set());
        // If no summary was provided but API generated one, pass it back
        if (!providedSummary?.trim() && data.summary && onSummaryGenerated) {
          onSummaryGenerated(data.summary);
        }
      } else {
        setError(data.error || "请求失败");
      }
    } catch {
      setError("网络错误");
    }
    setLoading(false);
  }, [title, content, noteSlug, providedSummary, existingSlugs, onSummaryGenerated]);

  useEffect(() => {
    if (open) fetchSuggestions();
  }, [open, fetchSuggestions]);

  const toggle = (slug: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === suggestions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(suggestions.map(s => s.slug)));
    }
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="AI 关联推荐">
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-text-muted">
              <div className="w-4 h-4 rounded-full border-2 border-nebula-purple/30 border-t-nebula-purple animate-spin" />
              <span className="text-sm">AI 分析中...</span>
            </div>
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm text-center py-4">{error}</p>
        ) : suggestions.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">未找到关联笔记</p>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {suggestions.map(s => (
                <label
                  key={s.slug}
                  className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    selected.has(s.slug) ? "bg-nebula-purple/10" : "hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(s.slug)}
                    onChange={() => toggle(s.slug)}
                    className="mt-0.5 shrink-0 w-4 h-4 rounded border-[var(--border-medium)] bg-transparent accent-nebula-purple"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">{s.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{s.reason}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
              <button
                onClick={toggleAll}
                className="text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                {selected.size === suggestions.length ? "取消全选" : "全选"}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selected.size === 0}
                  className="rounded-lg bg-nebula-purple/80 px-4 py-1.5 text-xs text-white hover:bg-nebula-purple transition-colors disabled:opacity-30"
                >
                  链接 {selected.size} 篇笔记
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
