import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none
      prose-headings:text-text-primary prose-headings:font-semibold
      prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
      prose-p:text-text-secondary prose-p:leading-relaxed
      prose-a:text-nebula-cyan prose-a:no-underline hover:prose-a:underline
      prose-strong:text-text-primary
      prose-code:text-nebula-purple prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg
      prose-pre:text-sm
      prose-ul:list-disc prose-ol:list-decimal
      prose-li:marker:text-text-muted
      prose-blockquote:border-l-nebula-purple prose-blockquote:text-text-muted prose-blockquote:not-italic
      prose-hr:border-white/10
      prose-img:rounded-lg
    ">
      <Markdown remarkPlugins={[remarkGfm]}>
        {content}
      </Markdown>
    </div>
  );
}
