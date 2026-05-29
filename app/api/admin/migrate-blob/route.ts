import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { db } from "@/lib/db";
import { notes, noteContent } from "@/lib/schema";
import { getStore } from "@edgeone/pages-blob";
import { eq } from "drizzle-orm";

const STORE_NAME = "notes-content";

export async function POST(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const allNotes = await db.select({ id: notes.id, title: notes.title, cosKey: notes.cosKey }).from(notes);
  const results: string[] = [];
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const note of allNotes) {
    const [nc] = await db.select({ rawMarkdown: noteContent.rawMarkdown })
      .from(noteContent).where(eq(noteContent.noteId, note.id)).limit(1);

    if (!nc?.rawMarkdown) {
      skipped++;
      continue;
    }

    try {
      const store = getStore(STORE_NAME);
      await store.set(note.cosKey, nc.rawMarkdown);
      const verify = await store.get(note.cosKey);
      if (verify !== null) {
        migrated++;
        results.push(`OK: ${note.title}`);
      } else {
        failed++;
        results.push(`VERIFY FAIL: ${note.title}`);
      }
    } catch (e: any) {
      failed++;
      results.push(`FAIL: ${note.title} — ${e.message}`);
    }
  }

  return NextResponse.json({
    total: allNotes.length,
    migrated,
    skipped,
    failed,
    results,
  });
}
