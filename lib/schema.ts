import { mysqlTable, varchar, text, datetime, json, int, primaryKey, index, mysqlEnum } from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";

// ─── Categories (hierarchical, self-referencing) ───
export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  parentId: varchar("parent_id", { length: 36 }),
  sortOrder: int("sort_order").default(0),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
  notes: many(notes),
}));

// ─── Tags ───
export const tags = mysqlTable("tags", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 60 }).notNull().unique(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  color: varchar("color", { length: 7 }).default("#6366f1"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  noteTags: many(noteTags),
}));

// ─── Notes (metadata only; body lives in COS) ───
export const notes = mysqlTable("notes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  categoryId: varchar("category_id", { length: 36 }),
  sourceId: varchar("source_id", { length: 36 }),
  cosKey: varchar("cos_key", { length: 500 }).notNull(),
  contentHash: varchar("content_hash", { length: 64 }),
  wordCount: int("word_count").default(0),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("published"),
  aiCategorySuggestion: varchar("ai_category_suggestion", { length: 100 }),
  aiTagsJson: json("ai_tags_json"),
  aiAnalyzedAt: datetime("ai_analyzed_at"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_notes_slug").on(table.slug),
  index("idx_notes_category").on(table.categoryId),
  index("idx_notes_status").on(table.status),
  index("idx_notes_source").on(table.sourceId),
]);

export const notesRelations = relations(notes, ({ one, many }) => ({
  category: one(categories, { fields: [notes.categoryId], references: [categories.id] }),
  source: one(sources, { fields: [notes.sourceId], references: [sources.id] }),
  noteTags: many(noteTags),
  sourceLinks: many(noteLinks, { relationName: "sourceLinks" }),
  targetLinks: many(noteLinks, { relationName: "targetLinks" }),
}));

// ─── Note-Tags junction ───
export const noteTags = mysqlTable("note_tags", {
  noteId: varchar("note_id", { length: 36 }).notNull(),
  tagId: varchar("tag_id", { length: 36 }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.noteId, table.tagId] }),
  index("idx_note_tags_tag").on(table.tagId),
]);

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, { fields: [noteTags.noteId], references: [notes.id] }),
  tag: one(tags, { fields: [noteTags.tagId], references: [tags.id] }),
}));

// ─── Bidirectional Links ───
export const noteLinks = mysqlTable("note_links", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sourceNoteId: varchar("source_note_id", { length: 36 }).notNull(),
  targetNoteId: varchar("target_note_id", { length: 36 }),
  targetSlug: varchar("target_slug", { length: 255 }).notNull(),
  context: text("context"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_links_source").on(table.sourceNoteId),
  index("idx_links_target").on(table.targetNoteId),
  index("idx_links_slug").on(table.targetSlug),
]);

export const noteLinksRelations = relations(noteLinks, ({ one }) => ({
  sourceNote: one(notes, { fields: [noteLinks.sourceNoteId], references: [notes.id], relationName: "sourceLinks" }),
  targetNote: one(notes, { fields: [noteLinks.targetNoteId], references: [notes.id], relationName: "targetLinks" }),
}));

// ─── Sources (immutable reference materials) ───
export const sources = mysqlTable("sources", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  url: varchar("url", { length: 2048 }),
  cosKey: varchar("cos_key", { length: 500 }),
  type: mysqlEnum("type", ["article", "paper", "book_chapter", "web_clip", "podcast", "video", "other"]).default("article"),
  summary: text("summary"),
  ingestedAt: datetime("ingested_at").default(sql`CURRENT_TIMESTAMP`),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sourcesRelations = relations(sources, ({ many }) => ({
  notes: many(notes),
}));

// ─── Operation Logs ───
export const operationLogs = mysqlTable("operation_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  timestamp: datetime("timestamp").default(sql`CURRENT_TIMESTAMP`).notNull(),
  type: mysqlEnum("type", ["ingest", "create", "edit", "delete", "analyze", "lint", "query"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  relatedNoteIds: json("related_note_ids"),
}, (table) => [
  index("idx_logs_timestamp").on(table.timestamp),
  index("idx_logs_type").on(table.type),
]);
