import { db } from "./db";
import { categories, notes } from "./schema";
import { eq, asc, and, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import slugify from "slugify";

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
