"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useTheme } from "@/components/theme/ThemeProvider";

export function MarkdownRenderer({ content }: { content: string }) {
  const { theme } = useTheme();
  return (
    <div className={`prose max-w-none ${theme === "dark" ? "prose-invert" : ""}
      prose-headings:font-bold prose-headings:tracking-tight
      prose-h1:text-3xl prose-h1:mt-10 prose-h1:mb-6
      prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-[var(--border-medium)]
      prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
      prose-p:text-text-secondary/90 prose-p:leading-[1.8] prose-p:text-[15px] prose-p:my-4
      prose-a:text-accent-cyan prose-a:no-underline prose-a:border-b prose-a:border-accent-cyan/30 prose-a:pb-0.5 hover:prose-a:border-accent-cyan
      prose-strong:text-text-primary prose-strong:font-semibold
      prose-code:text-accent-purple prose-code:bg-[var(--surface-hover)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-[var(--hljs-bg)] prose-pre:border prose-pre:border-[var(--border-medium)] prose-pre:rounded-xl prose-pre:shadow-sm
      prose-pre:text-[13px] prose-pre:leading-relaxed
      prose-ul:my-4 prose-ol:my-4
      prose-li:text-text-secondary/90 prose-li:my-1 prose-li:leading-relaxed
      prose-li:marker:text-accent-purple/60
      prose-blockquote:border-l-[3px] prose-blockquote:border-accent-purple/50 prose-blockquote:bg-accent-purple/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:my-6 prose-blockquote:text-text-muted prose-blockquote:not-italic prose-blockquote:text-[14px]
      prose-hr:border-[var(--border-medium)] prose-hr:my-8
      prose-img:rounded-xl prose-img:shadow-lg
      prose-table:border-collapse prose-table:w-full
      prose-th:border prose-th:border-[var(--border-medium)] prose-th:bg-[var(--surface-hover)] prose-th:px-4 prose-th:py-2 prose-th:text-sm prose-th:font-medium prose-th:text-text-primary
      prose-td:border prose-td:border-[var(--border-medium)] prose-td:px-4 prose-td:py-2 prose-td:text-sm
    `}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </Markdown>
    </div>
  );
}
