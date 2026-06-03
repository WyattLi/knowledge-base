"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IngestForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [useCookie, setUseCookie] = useState(false);
  const [cookie, setCookie] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("请输入网址");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          cookie: useCookie && cookie.trim() ? cookie.trim() : undefined,
        }),
      });

      if (res.ok) {
        const note = await res.json();
        router.push(`/notes/${note.slug}/edit`);
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error || "摄入失败");
      }
    } catch {
      setError("网络错误，请重试");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* URL input */}
      <div className="glass rounded-xl p-4">
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          className="w-full bg-transparent text-text-primary placeholder:text-text-muted text-sm focus:outline-none"
          autoFocus
        />
      </div>

      {/* Cookie toggle */}
      <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={useCookie}
          onChange={e => setUseCookie(e.target.checked)}
          className="w-4 h-4 rounded border-[var(--border-medium)] bg-transparent accent-nebula-purple"
        />
        需要登录 — 粘贴 Cookie
      </label>

      {/* Cookie input (collapsible) */}
      {useCookie && (
        <div className="space-y-1">
          <textarea
            value={cookie}
            onChange={e => setCookie(e.target.value)}
            placeholder="从浏览器 DevTools → Application → Cookies 复制 Cookie 值粘贴到这里"
            className="w-full glass rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted font-mono focus:outline-none resize-none h-20"
          />
          <p className="text-[10px] text-text-muted/60">
            打开目标网页 → F12 → Application → Cookies → 选中域名 → 复制各行的 Name=Value，用分号连接。示例：session=abc123; token=xyz789
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-nebula-purple/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-nebula-purple transition-colors disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            AI 正在阅读网页...
          </span>
        ) : (
          "开始摄入"
        )}
      </button>
    </form>
  );
}
