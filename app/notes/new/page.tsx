import { redirect } from "next/navigation";
import { isAuthenticatedServer } from "@/lib/auth";
import { NoteEditor } from "@/components/notes/NoteEditor";

export const dynamic = "force-dynamic";

export default async function NewNotePage() {
  if (!await isAuthenticatedServer()) redirect("/notes");

  return (
    <div className="max-w-4xl mx-auto px-6 py-4 h-full flex flex-col">
      <NoteEditor />
    </div>
  );
}
