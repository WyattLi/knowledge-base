"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useTheme } from "@/components/theme/ThemeProvider";

/** Convert [[target]] and [[target|alias]] wikilinks to clickable markdown links */
function resolveWikilinks(content: string): string {
  return content.replace(
    /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g,
    (_, target: string, alias: string) => {
      const slug = target.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w一-鿿\-]/g, "");
      const label = (alias || target).trim();
      return `[${label}](/notes/${slug})`;
    },
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const processed = resolveWikilinks(content);

  return (
    <div
      className="markdown-body"
      style={{
        backgroundColor: "transparent",
        colorScheme: isDark ? "dark" : "light",
        fontSize: "15px",
        lineHeight: "1.8",
        // github-markdown-css uses these CSS variables;
        // wire them to the project's semantic tokens
        "--color-canvas-default": "transparent",
        "--color-canvas-subtle": isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        "--color-fg-default": isDark ? "#e0dfe6" : "#1e1e1e",
        "--color-fg-muted": isDark ? "#9493a0" : "#5e5e5e",
        "--color-border-default": isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
        "--color-border-muted": isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
        "--color-accent-fg": isDark ? "#8b5cf6" : "#7c3aed",
        "--color-accent-emphasis": isDark ? "#22d3ee" : "#0891b2",
        "--color-neutral-muted": isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        "--color-danger-fg": isDark ? "#f87171" : "#dc2626",
      } as React.CSSProperties}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {processed}
      </Markdown>
    </div>
  );
}
