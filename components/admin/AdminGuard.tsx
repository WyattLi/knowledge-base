"use client";

import { ReactNode, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { LoginModal } from "@/components/auth/LoginModal";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-5 h-5 rounded-full border border-white/20 border-t-white/60 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-text-secondary text-sm">请先登录以访问管理页面</p>
        <button
          onClick={() => setLoginOpen(true)}
          className="rounded-lg bg-nebula-purple/80 text-white px-4 py-2 text-sm hover:bg-nebula-purple transition-colors"
        >
          登录
        </button>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  return <>{children}</>;
}
