import Link from "next/link";
import { notFound } from "next/navigation";
import { isAuthenticatedServer } from "@/lib/auth";
import { getNoteBySlug } from "@/lib/notes";
import { MarkdownRenderer } from "@/components/notes/MarkdownRenderer";
import { DeleteNoteButton } from "@/components/notes/DeleteNoteButton";
import GalaxyPageBackground from "@/components/background/GalaxyPageBackground";

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
    <div className="relative">
      <GalaxyPageBackground />
      <div className="relative z-10 max-w-3xl mx-auto px-8 py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-10">
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
            <>
              <Link
                href={`/notes/${note.slug}/edit`}
                className="text-sm px-3 py-1.5 rounded-lg glass text-text-secondary glass-hover transition-colors"
              >
                编辑
              </Link>
              <DeleteNoteButton slug={note.slug} />
            </>
          )}
        </div>
      </div>

      <article>
        {/* Title */}
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-text-primary leading-tight mb-4">{note.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
            <span>{note.wordCount?.toLocaleString()} 字</span>
            <span className="text-[var(--text-muted)]">·</span>
            <span>{new Date(note.updatedAt!).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</span>
            {note.status !== "published" && (
              <>
                <span className="text-[var(--text-muted)]">·</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  note.status === "draft" ? "bg-yellow-500/20 text-yellow-400" : "bg-[var(--surface-active)] text-text-muted"
                }`}>
                  {note.status === "draft" ? "草稿" : "已归档"}
                </span>
              </>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {tags.map((tag: any) => (
                <Link
                  key={tag.id}
                  href={`/notes?tagId=${tag.id}`}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:scale-105"
                  style={{ backgroundColor: tag.color + "18", color: tag.color, border: `1px solid ${tag.color}33`, boxShadow: `0 0 6px ${tag.color}10` }}
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* AI 摘要 */}
          {(note as any).summary && (
            <div className="mt-5 rounded-lg px-4 py-3 text-sm text-text-secondary leading-relaxed" style={{ background: "var(--surface)" }}>
              <span className="text-xs text-text-muted">AI 摘要: </span>
              {(note as any).summary}
            </div>
          )}
        </header>

        {/* Divider */}
        <div className="border-t border-[var(--border-medium)] mb-10" />

        {/* Content */}
        <MarkdownRenderer content={note.content as string} />

        {/* Divider */}
        <div className="border-t border-[var(--border-medium)] mt-12 mb-10" />

        {/* Outgoing links */}
        {outgoingLinks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-text-primary mb-4">链接到</h2>
            <div className="space-y-1.5">
              {outgoingLinks.map((link: any, i: number) => (
                <Link
                  key={i}
                  href={`/notes/${link.targetSlug}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <span className={link.targetExists ? "text-nebula-cyan" : "text-text-muted/40"}>
                    &#x2197;
                  </span>
                  <span className="text-sm text-text-primary">{link.targetExists ? link.targetTitle : link.targetSlug}</span>
                  {!link.targetExists && <span className="text-xs text-text-muted/40">（尚未创建）</span>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Backlinks */}
        {backlinks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-text-primary mb-4">引用此笔记</h2>
            <div className="space-y-1.5">
              {backlinks.map((bl: any) => (
                <Link
                  key={bl.id}
                  href={`/notes/${bl.sourceSlug}`}
                  className="block rounded-lg px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <span className="text-sm font-medium text-text-primary">{bl.sourceTitle}</span>
                  {bl.context && (
                    <p className="text-xs text-text-muted/60 mt-1 line-clamp-2">{bl.context}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {backlinks.length === 0 && outgoingLinks.length === 0 && (
          <div className="text-center py-8 text-text-muted/40 text-sm border-t border-[var(--border-subtle)] pt-10 mt-8">
            暂无链接关系
          </div>
        )}
      </article>
      </div>
    </div>
  );
}
