"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  enabled: boolean;
  createdAt: string;
}

export default function TagsAdminPage() {
  const [items, setItems] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<Tag | null>(null);
  const [form, setForm] = useState({ name: "", color: "#6366f1", enabled: true });
  const [showCreate, setShowCreate] = useState(false);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/tags?page=${page}&pageSize=${pageSize}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / pageSize);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), color: form.color }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: "", color: "#6366f1" });
      fetchData();
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const res = await fetch(`/api/tags/${editItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), color: form.color, enabled: form.enabled }),
    });
    if (res.ok) {
      setEditItem(null);
      fetchData();
    }
  };

  const toggleEnabled = async (item: Tag) => {
    await fetch(`/api/tags/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !item.enabled }),
    });
    fetchData();
  };

  const handleDelete = async (item: Tag) => {
    if (!confirm(`确定删除标签 "${item.name}"？`)) return;
    await fetch(`/api/tags/${item.id}`, { method: "DELETE" });
    fetchData();
  };

  const openEdit = (item: Tag) => {
    setEditItem(item);
    setForm({ name: item.name, color: item.color, enabled: item.enabled });
  };

  const openCreate = () => {
    setForm({ name: "", color: "#6366f1", enabled: true });
    setShowCreate(true);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">标签管理</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-nebula-purple/80 text-white px-4 py-2 text-sm hover:bg-nebula-purple transition-colors"
        >
          + 新建标签
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 rounded-full border border-[var(--border-medium)] border-t-[var(--accent-purple)] animate-spin" />
        </div>
      ) : (
        <>
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-text-secondary text-left">
                  <th className="px-4 py-3 font-medium">名称</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">颜色</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium w-32">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="px-4 py-3 text-text-primary">{item.name}</td>
                    <td className="px-4 py-3 text-text-muted font-mono text-xs">{item.slug}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                        <span className="text-text-muted font-mono text-xs">{item.color}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleEnabled(item)}
                        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                          item.enabled
                            ? "bg-green-500/20 text-green-400"
                            : "bg-[var(--surface-active)] text-text-muted"
                        }`}
                      >
                        {item.enabled ? "启用" : "禁用"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="text-nebula-cyan text-xs hover:underline">编辑</button>
                        <button onClick={() => handleDelete(item)} className="text-red-400 text-xs hover:underline">删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-text-muted text-center">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="glass rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
              >
                上一页
              </button>
              <span className="text-xs text-text-muted">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="glass rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建标签">
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="标签名称"
            className="w-full glass rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-nebula-purple/50"
            autoFocus
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
            />
            <input
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
              placeholder="#6366f1"
              className="flex-1 glass rounded-lg px-3 py-2 text-sm text-text-primary font-mono placeholder:text-text-secondary focus:outline-none focus:border-nebula-purple/50"
            />
          </div>
          <button type="submit" className="w-full rounded-lg bg-nebula-purple/80 text-white px-4 py-2 text-sm hover:bg-nebula-purple transition-colors">
            创建
          </button>
        </form>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="编辑标签">
        <form onSubmit={handleUpdate} className="space-y-3">
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="标签名称"
            className="w-full glass rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-nebula-purple/50"
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
            />
            <input
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
              className="flex-1 glass rounded-lg px-3 py-2 text-sm text-text-primary font-mono placeholder:text-text-secondary focus:outline-none focus:border-nebula-purple/50"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={e => setForm({ ...form, enabled: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--border-medium)] bg-transparent accent-nebula-purple"
            />
            启用
          </label>
          <button type="submit" className="w-full rounded-lg bg-nebula-purple/80 text-white px-4 py-2 text-sm hover:bg-nebula-purple transition-colors">
            保存
          </button>
        </form>
      </Modal>
    </div>
  );
}
