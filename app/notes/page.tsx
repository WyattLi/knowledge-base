import Link from "next/link";
import { isAuthenticatedServer } from "@/lib/auth";
import { listNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ categoryId?: string }> }) {
  const sp = await searchParams;
  const [notes, authed] = await Promise.all([listNotes({ categoryId: sp.categoryId, limit: 100 }), isAuthenticatedServer()]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">笔记</h1>
          <p className="text-text-muted text-sm mt-1">
            共 {notes.length} 篇{sp.categoryId ? "（已筛选）" : ""}
          </p>
        </div>
        {authed && (
          <Link
            href="/notes/new"
            className="inline-flex items-center gap-2 rounded-lg bg-nebula-purple/80 px-4 py-2 text-sm font-medium text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:bg-nebula-purple transition-colors"
          >
            + 新建笔记
          </Link>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-muted text-lg">还没有笔记</p>
          <p className="text-text-muted text-sm mt-2">点击右上角按钮创建第一篇笔记</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <div key={note.id}>
              <Link
                href={`/notes/${note.slug}`}
                className="block glass rounded-xl p-5 glass-hover transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-text-primary truncate">{note.title}</h3>
                  {note.status !== "published" && (
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-white/10 text-text-muted">
                      {note.status === "draft" ? "草稿" : "已归档"}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
                  <span>{note.wordCount} 字</span>
                  <span>{new Date(note.updatedAt!).toLocaleDateString("zh-CN")}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
