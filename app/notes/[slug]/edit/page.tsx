import { notFound, redirect } from "next/navigation";
import { isAuthenticatedServer } from "@/lib/auth";
import { getNoteBySlug } from "@/lib/notes";
import { NoteEditor } from "@/components/notes/NoteEditor";

export const dynamic = "force-dynamic";

export default async function EditNotePage({ params }: { params: Promise<{ slug: string }> }) {
  if (!await isAuthenticatedServer()) redirect("/notes");

  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-4 h-full flex flex-col">
      <NoteEditor
        noteSlug={slug}
        initialData={{
          title: note.title,
          content: note.content,
          categoryId: note.categoryId || "",
          status: note.status || "published",
          tagIds: (note.tags as any[])?.map((t: any) => t.id) || [],
        }}
      />
    </div>
  );
}
