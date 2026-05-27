"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "./AuthContext";

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    const ok = await login(password);
    setLoading(false);
    if (ok) {
      setPassword("");
      onClose();
    } else {
      setError("密码错误");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="登录">
      <form onSubmit={handleSubmit}>
        <p className="text-sm text-text-secondary mb-4">
          输入密码以解锁管理功能
        </p>
        <Input
          type="password"
          placeholder="输入访问密码"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          autoFocus
          className="w-full"
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" type="button" onClick={onClose}>取消</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "验证中..." : "登录"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
