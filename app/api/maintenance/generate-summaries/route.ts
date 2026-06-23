export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { db } from "@/lib/db";
import { notes, noteContent } from "@/lib/schema";
import { eq, isNull } from "drizzle-orm";
import { generateSummary } from "@/lib/ai";
import { blobGet } from "@/lib/blob";

export async function POST(request: Request) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    // Find notes without summaries
    const pending = await db
      .select({ noteId: noteContent.noteId, title: notes.title, slug: notes.slug, cosKey: notes.cosKey })
      .from(noteContent)
      .innerJoin(notes, eq(noteContent.noteId, notes.id))
      .where(isNull(noteContent.summary))
      .limit(20); // Batch size to avoid rate limiting

    if (pending.length === 0) {
      return NextResponse.json({ message: "所有笔记已有摘要", processed: 0 });
    }

    const results: { slug: string; success: boolean; error?: string }[] = [];

    for (const item of pending) {
      try {
        const content = await blobGet(item.cosKey);
        if (!content) {
          results.push({ slug: item.slug, success: false, error: "Blob 读取失败" });
          continue;
        }
        const summary = await generateSummary(item.title, content);
        await db.update(noteContent)
          .set({ summary, summaryAt: new Date() })
          .where(eq(noteContent.noteId, item.noteId));

        results.push({ slug: item.slug, success: true });
        // Small delay between API calls
        await new Promise(r => setTimeout(r, 500));
      } catch (e: any) {
        results.push({ slug: item.slug, success: false, error: e.message });
      }
    }

    return NextResponse.json({ processed: results.length, remaining: pending.length >= 20, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
