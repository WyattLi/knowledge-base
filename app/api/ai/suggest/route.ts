import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { generateSummary, suggestRelatedNotes } from "@/lib/ai";
import { prefilterCandidates } from "@/lib/notes";
import { db } from "@/lib/db";
import { noteTags } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getNoteBySlug } from "@/lib/notes";

export async function POST(request: Request) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { title, content, excludeSlug } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
    }

    // 1. Generate summary for current note (fire and forget — will be stored on save anyway)
    const summary = await generateSummary(title, content);

    // 2. Get current note's tags and category for pre-filter
    let currentTagIds: string[] = [];
    let currentCategoryId: string | null = null;
    if (excludeSlug) {
      const current = await getNoteBySlug(excludeSlug);
      if (current) {
        currentTagIds = ((current.tags as any[]) || []).map((t: any) => t.id);
        currentCategoryId = current.categoryId;
      }
    }

    // 3. Pre-filter: score all candidates by summary + tag + category overlap, take top 20
    const candidates = await prefilterCandidates(summary, currentTagIds, currentCategoryId, excludeSlug);

    // 4. AI precise ranking on the top candidates
    const suggestions = await suggestRelatedNotes(title, summary, candidates);

    return NextResponse.json({ suggestions, summary });
  } catch (e: any) {
    console.error("[ai/suggest] error:", e.message);
    return NextResponse.json({ error: e.message || "AI 分析失败" }, { status: 500 });
  }
}
