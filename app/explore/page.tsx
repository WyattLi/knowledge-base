import { ExplorePageClient } from "./ExplorePageClient";

export const metadata = { title: "知识星图 — Knowledge Base" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; tagId?: string }>;
}) {
  const sp = await searchParams;
  return <ExplorePageClient categoryId={sp.categoryId} tagId={sp.tagId} />;
}
