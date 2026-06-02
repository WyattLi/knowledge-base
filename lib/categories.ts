import { db } from "./db";
import { categories, notes } from "./schema";
import { eq, asc, sql, inArray } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import slugify from "slugify";
import { blobMove } from "./blob";

function makeSlug(name: string): string {
  const s = slugify(name, { lower: true, strict: true });
  return (s || name).slice(0, 100);
}

export async function listCategories() {
  const all = await db.select().from(categories)
    .where(eq(categories.enabled, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const top = all.filter(c => !c.parentId);
  const children = all.filter(c => c.parentId);

  return top.map(c => ({
    ...c,
    children: children.filter(ch => ch.parentId === c.id) || [],
  }));
}

export async function listCategoriesAdmin(options: { page: number; pageSize: number }) {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(categories);
  const items = await db.select().from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name))
    .limit(options.pageSize)
    .offset((options.page - 1) * options.pageSize);
  return { items, total: Number(count) };
}

export async function getCategory(id: string) {
  const [cat] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return cat || null;
}

/** Walk up the parent chain to build the full slug path, e.g. "tech/frontend" */
export async function getCategoryPath(categoryId: string): Promise<string> {
  const parts: string[] = [];
  let currentId: string | null = categoryId;
  while (currentId) {
    const cat = await getCategory(currentId);
    if (!cat) break;
    parts.unshift(cat.slug);
    currentId = cat.parentId;
  }
  return parts.join("/");
}

/** Build the blob key for a note, e.g. "notes/tech/frontend/my-note.md" */
export async function makeNoteKey(categoryId: string | null, noteSlug: string): Promise<string> {
  if (categoryId) {
    const path = await getCategoryPath(categoryId);
    return `notes/${path}/${noteSlug}.md`;
  }
  return `notes/${noteSlug}.md`;
}

/** Get all descendant category IDs (including self) */
async function getDescendantIds(categoryId: string): Promise<string[]> {
  const result: string[] = [categoryId];
  const children = await db.select({ id: categories.id })
    .from(categories)
    .where(eq(categories.parentId, categoryId));
  for (const child of children) {
    result.push(...await getDescendantIds(child.id));
  }
  return result;
}

export async function createCategory(data: { name: string; description?: string; parentId?: string; sortOrder?: number }) {
  const id = uuid();
  const slug = makeSlug(data.name);
  await db.insert(categories).values({
    id,
    name: data.name,
    slug,
    description: data.description || null,
    parentId: data.parentId || null,
    sortOrder: data.sortOrder || 0,
  });
  const [cat] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return cat;
}

export async function updateCategory(id: string, data: { name?: string; description?: string; parentId?: string | null; sortOrder?: number; enabled?: boolean }) {
  const [existing] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!existing) return null;

  const oldSlug = existing.slug;
  const oldPath = await getCategoryPath(id);

  const updates: any = {};
  if (data.name !== undefined) {
    updates.name = data.name;
    updates.slug = makeSlug(data.name);
  }
  if (data.description !== undefined) updates.description = data.description || null;
  if (data.parentId !== undefined) updates.parentId = data.parentId;
  if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;
  if (data.enabled !== undefined) updates.enabled = data.enabled;

  await db.update(categories).set(updates).where(eq(categories.id, id));

  // If slug changed, migrate blob keys for all notes under this category tree
  const newSlug = updates.slug ?? oldSlug;
  if (newSlug !== oldSlug) {
    const newPath = await getCategoryPath(id);
    if (oldPath !== newPath) {
      const oldPrefix = `notes/${oldPath}/`;
      const newPrefix = `notes/${newPath}/`;
      const catIds = await getDescendantIds(id);
      const affectedNotes = await db
        .select({ id: notes.id, cosKey: notes.cosKey })
        .from(notes)
        .where(inArray(notes.categoryId, catIds));

      for (const note of affectedNotes) {
        if (!note.cosKey.startsWith(oldPrefix)) continue;
        const relative = note.cosKey.slice(oldPrefix.length);
        const newKey = `${newPrefix}${relative}`;
        await blobMove(note.cosKey, newKey);
        await db.update(notes).set({ cosKey: newKey }).where(eq(notes.id, note.id));
      }
    }
  }

  const [updated] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return updated;
}

export async function deleteCategory(id: string) {
  const [existing] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!existing) return false;

  await db.update(notes).set({ categoryId: null }).where(eq(notes.categoryId, id));
  await db.update(categories).set({ parentId: null }).where(eq(categories.parentId, id));
  await db.delete(categories).where(eq(categories.id, id));
  return true;
}
