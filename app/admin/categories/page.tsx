"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { flatCategories } from "@/lib/category-tree";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  children: Category[];
}

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "", parentId: "", sortOrder: 0, enabled: true });
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description || null,
        parentId: form.parentId || null,
        sortOrder: form.sortOrder,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: "", description: "", parentId: "", sortOrder: 0, enabled: true });
      fetchData();
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const res = await fetch(`/api/categories/${editItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description || null,
        parentId: form.parentId || null,
        sortOrder: form.sortOrder,
        enabled: form.enabled,
      }),
    });
    if (res.ok) {
      setEditItem(null);
      fetchData();
    }
  };

  const toggleEnabled = async (item: Category) => {
    await fetch(`/api/categories/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !item.enabled }),
    });
    fetchData();
  };

  const handleDelete = async (item: Category) => {
    if (!confirm(`确定删除分类 "${item.name}"？其子分类将变为顶级分类。`)) return;
    await fetch(`/api/categories/${item.id}`, { method: "DELETE" });
    fetchData();
  };

  const openEdit = (item: Category) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description || "", parentId: item.parentId || "", sortOrder: item.sortOrder, enabled: item.enabled });
  };

  const openCreate = () => {
    setForm({ name: "", description: "", parentId: "", sortOrder: 0, enabled: true });
    setShowCreate(true);
  };

  const allCats = flatCategories(categories);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 rounded-full border border-[var(--border-medium)] border-t-[var(--accent-purple)] animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">分类管理</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-nebula-purple/80 text-white px-4 py-2 text-sm hover:bg-nebula-purple transition-colors"
        >
          + 新建分类
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-text-secondary text-left">
              <th className="px-4 py-3 font-medium">名称</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">排序</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium w-32">操作</th>
            </tr>
          </thead>
          <tbody>
            {allCats.map((item) => (
              <tr key={item.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors">
                <td className="px-4 py-3 text-text-primary">
                  <span style={{ paddingLeft: `${item.depth * 20}px` }}>
                    {item.depth > 0 && <span className="text-text-muted mr-1.5">├</span>}
                    {item.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-muted font-mono text-xs">{item.slug}</td>
                <td className="px-4 py-3 text-text-muted">{item.sortOrder}</td>
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
            {allCats.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-text-muted text-center">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建分类">
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="分类名称"
            className="w-full glass rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-nebula-purple/50"
            autoFocus
            required
          />
          <input
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="描述（可选）"
            className="w-full glass rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-nebula-purple/50"
          />
          <select
            value={form.parentId}
            onChange={e => setForm({ ...form, parentId: e.target.value })}
            className="w-full glass rounded-lg px-3 py-2 text-sm text-text-primary"
          >
            <option value="">无父分类（顶级）</option>
            {allCats.map(c => (
              <option key={c.id} value={c.id}>{"  ".repeat(c.depth)}{c.name}</option>
            ))}
          </select>
          <input
            type="number"
            value={form.sortOrder}
            onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
            placeholder="排序"
            className="w-full glass rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-nebula-purple/50"
          />
          <button type="submit" className="w-full rounded-lg bg-nebula-purple/80 text-white px-4 py-2 text-sm hover:bg-nebula-purple transition-colors">
            创建
          </button>
        </form>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="编辑分类">
        <form onSubmit={handleUpdate} className="space-y-3">
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="分类名称"
            className="w-full glass rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-nebula-purple/50"
            required
          />
          <input
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="描述"
            className="w-full glass rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-nebula-purple/50"
          />
          <select
            value={form.parentId}
            onChange={e => setForm({ ...form, parentId: e.target.value })}
            className="w-full glass rounded-lg px-3 py-2 text-sm text-text-primary"
          >
            <option value="">无父分类（顶级）</option>
            {allCats.filter(c => c.id !== editItem?.id).map(c => (
              <option key={c.id} value={c.id}>{"  ".repeat(c.depth)}{c.name}</option>
            ))}
          </select>
          <input
            type="number"
            value={form.sortOrder}
            onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
            placeholder="排序"
            className="w-full glass rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-nebula-purple/50"
          />
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
