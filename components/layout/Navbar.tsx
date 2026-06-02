"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { Button } from "@/components/ui/Button";

export function Navbar({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, loading, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      <nav className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          {children}
          <Link href="/explore" className="text-sm font-medium text-text-secondary tracking-wide hover:text-text-primary transition-colors">
            Knowledge Base
          </Link>
          <Link href="/notes" className="text-sm text-text-muted hover:text-text-primary transition-colors ml-3">
            笔记
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {isAuthenticated && (
            <>
              <Link
                href="/notes/new"
                className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                新建
              </Link>
              <Link
                href="/admin/categories"
                className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                管理
              </Link>
            </>
          )}
          {loading ? (
            <div className="w-4 h-4 rounded-full border border-white/20 border-t-white/60 animate-spin" />
          ) : isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={logout}>退出</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setLoginOpen(true)}>登录</Button>
          )}
        </div>
      </nav>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
