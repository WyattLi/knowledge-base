import GraphCanvas from "@/components/graph/GraphCanvas";

export const metadata = { title: "知识星图 — Knowledge Base" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; tagId?: string }>;
}) {
  const sp = await searchParams;
  return <GraphCanvas categoryId={sp.categoryId} tagId={sp.tagId} />;
}
