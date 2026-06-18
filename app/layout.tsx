import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import CosmicBackgroundWrapper from "@/components/background/CosmicBackgroundWrapper";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "Knowledge Base — 个人知识库",
  description: "AI 驱动的个人知识管理系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="h-full flex flex-col relative overflow-hidden">
        <ThemeProvider>
          <CosmicBackgroundWrapper />
          <Suspense fallback={null}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
