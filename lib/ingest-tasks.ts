import { db } from "./db";
import { ingestTasks } from "./schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export interface IngestTask {
  id: string;
  url: string;
  status: "pending" | "processing" | "completed" | "failed";
  noteId: string | null;
  noteSlug: string | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function createIngestTask(url: string): Promise<IngestTask> {
  const id = uuid();
  const now = new Date();
  await db.insert(ingestTasks).values({
    id,
    url,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  return { id, url, status: "pending", noteId: null, noteSlug: null, error: null, createdAt: now, updatedAt: now };
}

export async function updateIngestTask(
  id: string,
  data: { status?: "pending" | "processing" | "completed" | "failed"; noteId?: string | null; noteSlug?: string | null; error?: string | null }
): Promise<void> {
  await db.update(ingestTasks).set({ ...data, updatedAt: new Date() }).where(eq(ingestTasks.id, id));
}

export async function getIngestTask(id: string): Promise<IngestTask | null> {
  const [row] = await db.select().from(ingestTasks).where(eq(ingestTasks.id, id)).limit(1);
  if (!row) return null;
  return {
    id: row.id,
    url: row.url,
    status: row.status as IngestTask["status"],
    noteId: row.noteId ?? null,
    noteSlug: row.noteSlug ?? null,
    error: row.error ?? null,
    createdAt: row.createdAt ?? new Date(),
    updatedAt: row.updatedAt ?? new Date(),
  };
}
