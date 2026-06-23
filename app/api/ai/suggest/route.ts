export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { generateSummary, suggestRelatedNotes } from "@/lib/ai";
import { prefilterCandidates, getNoteBySlug } from "@/lib/notes";
import { db } from "@/lib/db";
import { noteTags, noteLinks, notes } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { title, content, excludeSlug, summary: providedSummary, existingSlugs } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
    }

    // 1. Use provided summary or generate one
    const summary = providedSummary?.trim() || await generateSummary(title, content);

    // 2. Get current note's tags and category for pre-filter
    let currentTagIds: string[] = [];
    let currentCategoryId: string | null = null;
    let currentNoteId: string | null = null;
    if (excludeSlug) {
      const current = await getNoteBySlug(excludeSlug);
      if (current) {
        currentTagIds = ((current.tags as any[]) || []).map((t: any) => t.id);
        currentCategoryId = current.categoryId;
        currentNoteId = current.id;
      }
    }

    // 3. Build dedup set: merge frontend [[slug]] links + DB noteLinks
    const dedupSlugs = new Set<string>(existingSlugs || []);
    if (currentNoteId) {
      const links = await db
        .select({ targetSlug: notes.slug })
        .from(noteLinks)
        .innerJoin(notes, eq(noteLinks.targetNoteId, notes.id))
        .where(eq(noteLinks.sourceNoteId, currentNoteId));
      for (const l of links) dedupSlugs.add(l.targetSlug);
    }

    // 4. Pre-filter: score candidates, exclude current note + already-linked
    const candidates = await prefilterCandidates(
      summary,
      currentTagIds,
      currentCategoryId,
      excludeSlug,
      dedupSlugs.size > 0 ? [...dedupSlugs] : undefined,
    );

    // 5. AI precise ranking on the top candidates
    const suggestions = await suggestRelatedNotes(title, summary, candidates);

    return NextResponse.json({ suggestions, summary });
  } catch (e: any) {
    console.error("[ai/suggest] error:", e.message);
    return NextResponse.json({ error: e.message || "AI 分析失败" }, { status: 500 });
  }
}
