import { db } from "./db";
import { tags, noteTags } from "./schema";
import { eq, asc, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import slugify from "slugify";

function makeTagSlug(name: string): string {
  const s = slugify(name, { lower: true, strict: true });
  return (s || name).slice(0, 60);
}

export async function listTags() {
  return db.select().from(tags).where(eq(tags.enabled, true)).orderBy(asc(tags.name));
}

export async function listTagsAdmin(options: { page: number; pageSize: number }) {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(tags);
  const items = await db.select().from(tags)
    .orderBy(asc(tags.name))
    .limit(options.pageSize)
    .offset((options.page - 1) * options.pageSize);
  return { items, total: Number(count) };
}

export async function createTag(data: { name: string; color?: string }) {
  const id = uuid();
  const slug = makeTagSlug(data.name);
  await db.insert(tags).values({
    id,
    name: data.name,
    slug,
    color: data.color || "#6366f1",
  });
  const [tag] = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  return tag;
}

export async function updateTag(id: string, data: { name?: string; color?: string; enabled?: boolean }) {
  const [existing] = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  if (!existing) return null;

  const updates: any = {};
  if (data.name !== undefined) {
    updates.name = data.name;
    updates.slug = makeTagSlug(data.name);
  }
  if (data.color !== undefined) updates.color = data.color;
  if (data.enabled !== undefined) updates.enabled = data.enabled;

  await db.update(tags).set(updates).where(eq(tags.id, id));
  const [updated] = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  return updated;
}

export async function deleteTag(id: string) {
  const [existing] = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  if (!existing) return false;
  await db.delete(noteTags).where(eq(noteTags.tagId, id));
  await db.delete(tags).where(eq(tags.id, id));
  return true;
}
