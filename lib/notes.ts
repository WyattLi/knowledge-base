import { db } from "./db";
import { notes, noteLinks, noteTags, tags, categories, noteContent } from "./schema";
import { eq, ne, desc, and, sql, inArray } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import slugify from "slugify";
import { blobPut, blobGet, blobDelete, blobMove } from "./blob";
import { makeNoteKey } from "./categories";
import { generateSummary } from "./ai";

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
  // [text](target) — skip external URLs and images ![alt](url)
  for (const m of content.matchAll(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g)) {
    const target = m[2].trim();
    if (target.startsWith("http://") || target.startsWith("https://")) continue;
    if (target.startsWith("/api/")) continue;  // uploaded images/files
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
  tagIds?: string[];
  limit?: number;
  offset?: number;
}) {
  const conditions = [];
  if (options?.status) conditions.push(eq(notes.status, options.status as any));
  if (options?.categoryId) conditions.push(eq(notes.categoryId, options.categoryId));
  // Support both single tagId (backward compat) and multiple tagIds
  const effectiveTagIds = options?.tagIds?.length ? options.tagIds : (options?.tagId ? [options.tagId] : []);
  if (effectiveTagIds.length > 0) {
    // OR logic: notes matching ANY of the selected tags
    const taggedNoteIds = db.select({ noteId: noteTags.noteId }).from(noteTags).where(inArray(noteTags.tagId, effectiveTagIds));
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

  const [nc] = await db.select({ summary: noteContent.summary }).from(noteContent).where(eq(noteContent.noteId, note.id)).limit(1);

  return {
    ...note,
    content: content || "",
    summary: nc?.summary || null,
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
  sourceId?: string;
  summary?: string;
}) {
  const id = uuid();
  const slug = makeSlug(data.title);
  const now = new Date();
  const plainText = stripMarkdown(data.content);
  const cosKey = await makeNoteKey(data.categoryId || null, slug);

  await blobPut(cosKey, data.content);

  await db.insert(notes).values({
    id,
    title: data.title,
    slug,
    cosKey,
    categoryId: data.categoryId || null,
    sourceId: data.sourceId || null,
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

  const summary = data.summary || null;
  await db.insert(noteContent).values({ noteId: id, plainText, rawMarkdown: data.content, summary, summaryAt: summary ? new Date() : null });
  await syncNoteLinks(id, data.content);

  // Fire-and-forget auto summary only if user didn't provide one
  if (!summary) {
    generateSummary(data.title, data.content).then(async sum => {
      await db.update(noteContent).set({ summary: sum, summaryAt: new Date() }).where(eq(noteContent.noteId, id));
    }).catch(e => console.warn("[notes] summary generation failed:", e.message));
  }

  return getNoteBySlug(slug);
}

export async function updateNote(slug: string, data: {
  title?: string;
  content?: string;
  categoryId?: string;
  status?: string;
  tagIds?: string[];
  summary?: string;
}) {
  const existing = await getNoteBySlug(slug);
  if (!existing) return null;

  const updates: any = { updatedAt: new Date() };
  let newKey: string | null = null;

  if (data.title !== undefined) {
    updates.title = data.title;
    updates.slug = makeSlug(data.title);
  }
  if (data.categoryId !== undefined) updates.categoryId = data.categoryId || null;

  // Compute new key if slug or category changed, or if key is stale (old format)
  const newSlug = updates.slug ?? existing.slug;
  const newCatId = updates.categoryId !== undefined ? (updates.categoryId || null) : existing.categoryId;
  const expectedKey = await makeNoteKey(newCatId, newSlug);
  if (expectedKey !== existing.cosKey) {
    newKey = expectedKey;
    updates.cosKey = newKey;
  }

  if (data.status !== undefined) updates.status = data.status;

  await db.update(notes).set(updates).where(eq(notes.id, existing.id));

  if (data.content !== undefined) {
    const plainText = stripMarkdown(data.content);
    const key = newKey ?? existing.cosKey;
    if (newKey && existing.cosKey !== newKey) {
      await blobMove(existing.cosKey, newKey);
    }
    await blobPut(key, data.content);
    await db.update(notes).set({ wordCount: plainText.length }).where(eq(notes.id, existing.id));
    const summaryUpdate: any = {};
    if (data.summary !== undefined) summaryUpdate.summary = data.summary || null;
    if (data.summary !== undefined) summaryUpdate.summaryAt = data.summary ? new Date() : null;

    await db.insert(noteContent).values({ noteId: existing.id, plainText, rawMarkdown: data.content, ...summaryUpdate })
      .onDuplicateKeyUpdate({ set: { plainText, rawMarkdown: data.content, ...summaryUpdate } });
    await syncNoteLinks(existing.id, data.content);

    if (!data.summary) {
      const titleForSummary = updates.title ?? existing.title;
      generateSummary(titleForSummary, data.content).then(async sum => {
        await db.update(noteContent).set({ summary: sum, summaryAt: new Date() }).where(eq(noteContent.noteId, existing.id));
      }).catch(e => console.warn("[notes] summary generation failed:", e.message));
    }
  } else if (newKey && existing.cosKey !== newKey) {
    // Slug/category changed but content didn't — move the blob
    await blobMove(existing.cosKey, newKey);
  }

  // Summary-only update (no content change)
  if (data.summary !== undefined && data.content === undefined) {
    await db.update(noteContent)
      .set({ summary: data.summary || null, summaryAt: data.summary ? new Date() : null })
      .where(eq(noteContent.noteId, existing.id));
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
  await db.delete(noteContent).where(eq(noteContent.noteId, note.id));
  await db.delete(notes).where(eq(notes.id, note.id));

  return true;
}

/**
 * Pre-filter: score candidates by summary overlap, tag overlap, and category match.
 * Returns top 20 for AI to rank precisely. Falls back to word-overlap if no summaries.
 */
export async function prefilterCandidates(
  currentSummary: string,
  currentTagIds: string[],
  currentCategoryId: string | null,
  excludeSlug?: string,
): Promise<{ slug: string; title: string; summary: string }[]> {
  // Fetch all notes with their summaries and tags
  const allNotes = await db
    .select({
      slug: notes.slug,
      title: notes.title,
      categoryId: notes.categoryId,
      summary: noteContent.summary,
    })
    .from(notes)
    .leftJoin(noteContent, eq(notes.id, noteContent.noteId))
    .where(excludeSlug ? and(ne(notes.slug, excludeSlug)) : undefined);

  // Fetch tags per note for scoring
  const noteTagsList = await db
    .select({ noteSlug: notes.slug, tagId: noteTags.tagId })
    .from(noteTags)
    .innerJoin(notes, eq(noteTags.noteId, notes.id));

  const tagsBySlug = new Map<string, Set<string>>();
  for (const nt of noteTagsList) {
    if (!tagsBySlug.has(nt.noteSlug)) tagsBySlug.set(nt.noteSlug, new Set());
    tagsBySlug.get(nt.noteSlug)!.add(nt.tagId);
  }

  const currentTagSet = new Set(currentTagIds);

  // Score each candidate
  const currentWords = extractKeywords(currentSummary);
  const scored = allNotes.map(n => {
    let score = 0;

    // Summary overlap (primary)
    if (n.summary && currentWords.size > 0) {
      const candidateWords = extractKeywords(n.summary);
      const intersection = [...currentWords].filter(w => candidateWords.has(w)).length;
      score += intersection * 3;
    }

    // Tag overlap
    const noteTags = tagsBySlug.get(n.slug) || new Set();
    const sharedTags = [...noteTags].filter(t => currentTagSet.has(t)).length;
    score += sharedTags * 2;

    // Same category
    if (currentCategoryId && n.categoryId === currentCategoryId) {
      score += 1;
    }

    return { slug: n.slug, title: n.title, summary: n.summary || "", score };
  });

  // Sort by score desc, take top 20
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 20).map(({ slug, title, summary }) => ({ slug, title, summary }));
}

/** Extract meaningful Chinese/English keywords from text for matching */
function extractKeywords(text: string): Set<string> {
  const cleaned = text
    .replace(/[，。！？、；：""''（）\n\r\t.,!?;:()"'`#*\-\[\]|\\/]+/g, " ")
    .toLowerCase();
  const words = cleaned.split(/\s+/).filter(w => w.length >= 2);
  return new Set(words);
}
