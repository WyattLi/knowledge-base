import Link from "next/link";
import { notFound } from "next/navigation";
import { getNoteBySlug } from "@/lib/notes";

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/notes" className="text-sm text-text-muted hover:text-text-primary transition-colors">
          &larr; 返回列表
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/notes/${note.slug}/edit`}
            className="text-sm px-3 py-1.5 rounded-lg glass text-text-secondary glass-hover transition-colors"
          >
            编辑
          </Link>
        </div>
      </div>

      <article>
        <h1 className="text-3xl font-bold text-text-primary mb-4">{note.title}</h1>

        <div className="flex items-center gap-4 text-sm text-text-muted mb-8">
          <span>{note.wordCount} 字</span>
          <span>更新于 {new Date(note.updatedAt!).toLocaleDateString("zh-CN")}</span>
          {note.status !== "published" && (
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">
              {note.status === "draft" ? "草稿" : "已归档"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-8">
          {(note.tags as any[])?.map((tag: any) => (
            <span
              key={tag.id}
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}44` }}
            >
              {tag.name}
            </span>
          ))}
        </div>

        <div className="prose prose-invert max-w-none glass rounded-xl p-6">
          <pre className="text-text-secondary whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {note.content}
          </pre>
        </div>

        {note.backlinks && (note.backlinks as any[]).length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-text-primary mb-4">反向链接</h2>
            <div className="space-y-2">
              {(note.backlinks as any[]).map((bl: any) => (
                <Link
                  key={bl.id}
                  href={`/notes/${bl.sourceSlug}`}
                  className="block glass rounded-lg p-3 glass-hover transition-colors"
                >
                  <span className="text-sm font-medium text-text-primary">{bl.sourceTitle}</span>
                  {bl.context && (
                    <p className="text-xs text-text-muted mt-1 truncate">{bl.context}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
