"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthContext";
import { Navbar } from "./Navbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="relative z-10 flex-1">{children}</main>
    </AuthProvider>
  );
}
