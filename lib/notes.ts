import { db } from "./db";
import { notes, noteLinks, noteTags, tags, categories } from "./schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import slugify from "slugify";
import { blobPut, blobGet, blobDelete } from "./blob";

/** Extract internal link targets from markdown: [[target]] and [text](target) — skips http URLs */
function extractLinks(content: string): { target: string; context: string }[] {
  const results: { target: string; context: string }[] = [];
  // [[target]] or [[target|alias]]
  for (const m of content.matchAll(/\[\[([^\]|]+?)(?:\|[^\]]+?)?\]\]/g)) {
    const target = m[1].trim();
    const start = Math.max(0, m.index! - 30);
    const end = Math.min(content.length, m.index! + m[0].length + 30);
    results.push({ target, context: content.slice(start, end) });
  }
  // [text](target) — skip external URLs
  for (const m of content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    const target = m[2].trim();
    if (target.startsWith("http://") || target.startsWith("https://")) continue;
    const start = Math.max(0, m.index! - 30);
    const end = Math.min(content.length, m.index! + m[0].length + 30);
    results.push({ target, context: content.slice(start, end) });
  }
  return results;
}

async function syncNoteLinks(noteId: string, content: string) {
  // Remove old links
  await db.delete(noteLinks).where(eq(noteLinks.sourceNoteId, noteId));

  const links = extractLinks(content);
  if (links.length === 0) return;

  // Look up which target slugs exist as notes
  const existingNotes = await db
    .select({ id: notes.id, slug: notes.slug })
    .from(notes);

  const slugToId = new Map(existingNotes.map(n => [n.slug, n.id]));

  const rows = links.map(l => ({
    id: uuid(),
    sourceNoteId: noteId,
    targetNoteId: slugToId.get(l.target) || null,
    targetSlug: l.target,
    context: l.context,
  }));

  await db.insert(noteLinks).values(rows);
}

export function makeSlug(title: string): string {
  const s = slugify(title, { lower: true, strict: true });
  return (s || title).slice(0, 255);
}

export function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[.*?\]\([^)]+\)/g, "")
    .replace(/^[-*+]\s/gm, "")
    .replace(/^>\s/gm, "")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export async function listNotes(options?: {
  status?: string;
  categoryId?: string;
  tagId?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];
  if (options?.status) conditions.push(eq(notes.status, options.status as any));
  if (options?.categoryId) conditions.push(eq(notes.categoryId, options.categoryId));
  if (options?.tagId) {
    const taggedNoteIds = db.select({ noteId: noteTags.noteId }).from(noteTags).where(eq(noteTags.tagId, options.tagId));
    conditions.push(inArray(notes.id, taggedNoteIds));
  }

  const query = db.select({
    id: notes.id,
    title: notes.title,
    slug: notes.slug,
    status: notes.status,
    categoryId: notes.categoryId,
    wordCount: notes.wordCount,
    createdAt: notes.createdAt,
    updatedAt: notes.updatedAt,
  }).from(notes).where(and(...conditions)).orderBy(desc(notes.updatedAt));

  if (options?.limit) query.limit(options.limit);
  if (options?.offset) query.offset(options.offset);

  return query;
}

export async function getNoteBySlug(slug: string) {
  try { slug = decodeURIComponent(slug); } catch {}
  const [note] = await db.select().from(notes).where(eq(notes.slug, slug)).limit(1);
  if (!note) return null;

  let content = await blobGet(note.cosKey);
  if (content === null) content = "";

  const noteTagList = await db.select({ tag: tags })
    .from(noteTags).innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(eq(noteTags.noteId, note.id));

  const backlinks = await db.select({
    id: noteLinks.id,
    sourceNoteId: noteLinks.sourceNoteId,
    sourceTitle: notes.title,
    sourceSlug: notes.slug,
    context: noteLinks.context,
  }).from(noteLinks).innerJoin(notes, eq(noteLinks.sourceNoteId, notes.id))
    .where(eq(noteLinks.targetNoteId, note.id));

  const outgoingLinks = await db.select({
    targetSlug: noteLinks.targetSlug,
    targetTitle: notes.title,
    targetExists: sql<boolean>`${noteLinks.targetNoteId} IS NOT NULL`,
  }).from(noteLinks).leftJoin(notes, eq(noteLinks.targetNoteId, notes.id))
    .where(eq(noteLinks.sourceNoteId, note.id));

  const category = note.categoryId
    ? (await db.select().from(categories).where(eq(categories.id, note.categoryId)).limit(1))[0] || null
    : null;

  return {
    ...note,
    content: content || "",
    tags: noteTagList.map(nt => nt.tag),
    category,
    backlinks,
    outgoingLinks,
  };
}

export async function createNote(data: {
  title: string;
  content: string;
  categoryId?: string;
  status?: string;
  tagIds?: string[];
}) {
  const id = uuid();
  const slug = makeSlug(data.title);
  const now = new Date();
  const plainText = stripMarkdown(data.content);
  const cosKey = `notes/${slug}.md`;

  await blobPut(cosKey, data.content);

  await db.insert(notes).values({
    id,
    title: data.title,
    slug,
    cosKey,
    categoryId: data.categoryId || null,
    status: (data.status as any) || "published",
    wordCount: plainText.length,
    createdAt: now,
    updatedAt: now,
  });

  if (data.tagIds?.length) {
    await db.insert(noteTags).values(
      data.tagIds.map(tagId => ({ noteId: id, tagId }))
    );
  }

  await syncNoteLinks(id, data.content);

  return getNoteBySlug(slug);
}

export async function updateNote(slug: string, data: {
  title?: string;
  content?: string;
  categoryId?: string;
  status?: string;
  tagIds?: string[];
}) {
  const existing = await getNoteBySlug(slug);
  if (!existing) return null;

  const updates: any = { updatedAt: new Date() };
  if (data.title !== undefined) {
    updates.title = data.title;
    updates.slug = makeSlug(data.title);
  }
  if (data.categoryId !== undefined) updates.categoryId = data.categoryId || null;
  if (data.status !== undefined) updates.status = data.status;

  await db.update(notes).set(updates).where(eq(notes.id, existing.id));

  if (data.content !== undefined) {
    const plainText = stripMarkdown(data.content);
    const key = updates.slug ? `notes/${updates.slug}.md` : existing.cosKey;
    await blobPut(key, data.content);
    await db.update(notes).set({ wordCount: plainText.length }).where(eq(notes.id, existing.id));
    await syncNoteLinks(existing.id, data.content);
  }

  if (data.tagIds !== undefined) {
    await db.delete(noteTags).where(eq(noteTags.noteId, existing.id));
    if (data.tagIds.length) {
      await db.insert(noteTags).values(
        data.tagIds.map(tagId => ({ noteId: existing.id, tagId }))
      );
    }
  }

  return getNoteBySlug(updates.slug || slug);
}

export async function deleteNote(slug: string) {
  const note = await getNoteBySlug(slug);
  if (!note) return false;

  await blobDelete(note.cosKey);
  await db.delete(noteLinks).where(eq(noteLinks.sourceNoteId, note.id));
  await db.delete(noteLinks).where(eq(noteLinks.targetNoteId, note.id));
  await db.delete(noteTags).where(eq(noteTags.noteId, note.id));
  await db.delete(notes).where(eq(notes.id, note.id));

  return true;
}
