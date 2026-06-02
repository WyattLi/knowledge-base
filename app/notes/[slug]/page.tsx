import Link from "next/link";
import { notFound } from "next/navigation";
import { isAuthenticatedServer } from "@/lib/auth";
import { getNoteBySlug } from "@/lib/notes";
import { MarkdownRenderer } from "@/components/notes/MarkdownRenderer";

export const dynamic = "force-dynamic";

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [note, authed] = await Promise.all([getNoteBySlug(slug), isAuthenticatedServer()]);
  if (!note) notFound();

  const backlinks = (note.backlinks as any[]) || [];
  const outgoingLinks = (note.outgoingLinks as any[]) || [];
  const tags = (note.tags as any[]) || [];
  const category = note.category as any;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/notes" className="text-sm text-text-muted hover:text-text-primary transition-colors">
          &larr; 返回列表
        </Link>
        <div className="flex items-center gap-3">
          {category && (
            <Link
              href={`/notes?categoryId=${category.id}`}
              className="text-xs px-2.5 py-1 rounded-full glass text-text-secondary hover:text-text-primary transition-colors"
            >
              {category.name}
            </Link>
          )}
          {authed && (
            <Link
              href={`/notes/${note.slug}/edit`}
              className="text-sm px-3 py-1.5 rounded-lg glass text-text-secondary glass-hover transition-colors"
            >
              编辑
            </Link>
          )}
        </div>
      </div>

      <article>
        {/* Title */}
        <h1 className="text-3xl font-bold text-text-primary mb-2">{note.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-text-muted mb-6">
          <span>{note.wordCount} 字</span>
          <span>更新于 {new Date(note.updatedAt!).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</span>
          {note.status !== "published" && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              note.status === "draft" ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 text-text-muted"
            }`}>
              {note.status === "draft" ? "草稿" : "已归档"}
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-8">
            {tags.map((tag: any) => (
              <Link
                key={tag.id}
                href={`/notes?tagId=${tag.id}`}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}44` }}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="glass rounded-xl p-8 mb-12">
          <MarkdownRenderer content={note.content as string} />
        </div>

        {/* Outgoing links */}
        {outgoingLinks.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-text-primary mb-4">链接到</h2>
            <div className="space-y-2">
              {outgoingLinks.map((link: any, i: number) => (
                <Link
                  key={i}
                  href={`/notes/${link.targetSlug}`}
                  className="flex items-center gap-2 glass rounded-lg p-3 glass-hover transition-colors"
                >
                  {link.targetExists ? (
                    <>
                      <span className="text-nebula-cyan text-xs">&#x2197;</span>
                      <span className="text-sm font-medium text-text-primary">{link.targetTitle}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-text-muted text-xs">&#x2197;</span>
                      <span className="text-sm text-text-muted">{link.targetSlug}</span>
                      <span className="text-xs text-text-muted/50">（尚未创建）</span>
                    </>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Backlinks */}
        {backlinks.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-text-primary mb-4">引用此笔记</h2>
            <div className="space-y-2">
              {backlinks.map((bl: any) => (
                <Link
                  key={bl.id}
                  href={`/notes/${bl.sourceSlug}`}
                  className="block glass rounded-lg p-3 glass-hover transition-colors"
                >
                  <span className="text-sm font-medium text-text-primary">{bl.sourceTitle}</span>
                  {bl.context && (
                    <p className="text-xs text-text-muted mt-1.5 line-clamp-2">{bl.context}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No links at all */}
        {backlinks.length === 0 && outgoingLinks.length === 0 && (
          <div className="text-center py-10 text-text-muted text-sm">
            暂无链接关系
          </div>
        )}
      </article>
    </div>
  );
}
