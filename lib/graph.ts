import { db } from "./db";
import { notes, noteLinks, noteTags, tags } from "./schema";
import { eq, and, isNotNull, sql } from "drizzle-orm";

export interface GraphNode {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  tags: { id: string; name: string; slug: string; color: string }[];
  wordCount: number;
  linkCount: number;
  citationCount: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  targetSlug: string;
}

export async function getGraphData(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const allNotes = await db.select({
    id: notes.id,
    title: notes.title,
    slug: notes.slug,
    categoryId: notes.categoryId,
    wordCount: notes.wordCount,
  }).from(notes).where(eq(notes.status, "published"));

  const allLinks = await db.select({
    id: noteLinks.id,
    sourceNoteId: noteLinks.sourceNoteId,
    targetNoteId: noteLinks.targetNoteId,
    targetSlug: noteLinks.targetSlug,
  }).from(noteLinks).where(isNotNull(noteLinks.targetNoteId));

  const noteIds = new Set(allNotes.map(n => n.id));

  const edges: GraphEdge[] = allLinks
    .filter(l => noteIds.has(l.sourceNoteId) && l.targetNoteId && noteIds.has(l.targetNoteId))
    .map(l => ({ id: l.id, source: l.sourceNoteId, target: l.targetNoteId!, targetSlug: l.targetSlug }));

  const citationCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();
  for (const l of edges) {
    citationCount.set(l.target, (citationCount.get(l.target) || 0) + 1);
    outgoingCount.set(l.source, (outgoingCount.get(l.source) || 0) + 1);
  }

  const allTags = await db.select({
    noteId: noteTags.noteId,
    tagId: tags.id,
    tagName: tags.name,
    tagSlug: tags.slug,
    tagColor: tags.color,
  }).from(noteTags).innerJoin(tags, eq(noteTags.tagId, tags.id));

  const tagsByNote = new Map<string, { id: string; name: string; slug: string; color: string }[]>();
  for (const t of allTags) {
    if (!tagsByNote.has(t.noteId)) tagsByNote.set(t.noteId, []);
    tagsByNote.get(t.noteId)!.push({ id: t.tagId, name: t.tagName, slug: t.tagSlug, color: t.tagColor });
  }

  const nodes: GraphNode[] = allNotes.map(n => ({
    id: n.id,
    title: n.title,
    slug: n.slug,
    categoryId: n.categoryId,
    tags: tagsByNote.get(n.id) || [],
    wordCount: n.wordCount,
    citationCount: citationCount.get(n.id) || 0,
    linkCount: (citationCount.get(n.id) || 0) + (outgoingCount.get(n.id) || 0),
  }));

  return { nodes, edges };
}
