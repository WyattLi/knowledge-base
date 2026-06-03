import { redirect } from "next/navigation";
import { isAuthenticatedServer } from "@/lib/auth";
import { IngestForm } from "./IngestForm";

export const dynamic = "force-dynamic";

export default async function NewSourcePage() {
  if (!await isAuthenticatedServer()) redirect("/notes");
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-text-primary mb-2">摄入网页</h1>
      <p className="text-text-muted text-sm mb-8">输入网址，AI 会自动阅读并生成一篇结构化笔记。</p>
      <IngestForm />
    </div>
  );
}
