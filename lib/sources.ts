import { db } from "./db";
import { sources } from "./schema";
import { v4 as uuid } from "uuid";

export async function createSource(data: {
  url: string;
  title: string;
  type?: string;
  summary?: string;
}) {
  const id = uuid();
  await db.insert(sources).values({
    id,
    title: data.title,
    url: data.url,
    type: (data.type as any) || "article",
    summary: data.summary || null,
  });
  return { id };
}
