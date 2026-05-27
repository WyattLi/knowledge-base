"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { isAuthenticated, loading, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      <nav className="relative z-20 flex items-center justify-between px-6 py-3">
        <span className="text-sm font-medium text-text-secondary tracking-wide">
          Knowledge Base
        </span>
        <div className="flex items-center gap-2">
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
