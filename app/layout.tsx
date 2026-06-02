import type { Metadata } from "next";
import "./globals.css";
import CosmicBackground from "@/components/background/CosmicBackground";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Knowledge Base — 个人知识库",
  description: "AI 驱动的个人知识管理系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="h-full flex flex-col relative overflow-hidden">
        <CosmicBackground />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
