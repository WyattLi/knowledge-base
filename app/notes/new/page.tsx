import { NoteEditor } from "@/components/notes/NoteEditor";

export default function NewNotePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-8">新建笔记</h1>
      <NoteEditor />
    </div>
  );
}
