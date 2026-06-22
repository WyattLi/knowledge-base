export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { isAuthenticated } from "@/lib/auth";
import { ingestUrl } from "@/lib/ai";
import { createSource } from "@/lib/sources";
import { createNote } from "@/lib/notes";

/**
 * Extract article content from HTML using Mozilla's Readability
 * (same algorithm as Firefox Reader Mode).
 * Returns { title, textContent } or null if extraction failed.
 */
function extractArticle(html: string, url: string): { title: string; textContent: string } | null {
  try {
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();
    if (!article) return null;

    return {
      title: article.title || doc.window.document.title || "",
      textContent: article.textContent || "",
    };
  } catch {
    return null;
  }
}

/**
 * Fetch a URL with timeout, returns { ok, status, text }.
 * Never throws — returns error info on failure.
 */
async function safeFetch(url: string, cookie?: string, timeoutMs = 15000): Promise<{ ok: boolean; status: number; text: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    };
    if (cookie) headers["Cookie"] = cookie;
    const res = await fetch(url, { signal: controller.signal, headers });
    clearTimeout(timer);
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (e: any) {
    return { ok: false, status: 0, text: "", error: e.message };
  }
}

/**
 * If the page is a docsify/vuepress SPA, resolve the underlying
 * markdown source from GitHub raw.
 */
async function tryDocsifyFallback(html: string, originalUrl: string, cookie?: string): Promise<{ content: string; title: string } | null> {
  if (!html.includes("$docsify") && !html.includes("docsify")) return null;

  const repoMatch = html.match(/repo\s*:\s*['"](https:\/\/github\.com\/[^'"]+)['"]/);
  if (!repoMatch) return null;

  const repoUrl = repoMatch[1];
  const repoPath = repoUrl.replace("https://github.com/", "");

  const hashMatch = originalUrl.match(/#\/\.?\/(.+?)(?:\?|$)/);
  if (!hashMatch) return null;

  const hashPath = hashMatch[1];
  const cleanPath = decodeURIComponent(hashPath).replace(/\/$/, "");

  const rawBases = [
    `https://raw.githubusercontent.com/${repoPath}/main`,
    `https://raw.fastgit.org/${repoPath}/main`,
    `https://ghproxy.com/https://raw.githubusercontent.com/${repoPath}/main`,
  ];

  const candidates = [
    `/docs/${cleanPath}.md`,
    `/${cleanPath}.md`,
    `/docs/${cleanPath}/README.md`,
  ];

  for (const base of rawBases) {
    for (const candidate of candidates) {
      const { ok, text, error } = await safeFetch(base + candidate, cookie, 10000);
      if (ok && text.length > 50) {
        const titleMatch = text.match(/^#\s+(.+)/m);
        return {
          content: text,
          title: titleMatch ? titleMatch[1].trim() : cleanPath.split("/").pop() || "",
        };
      }
      console.warn(`[ai/ingest] docsify fallback failed: ${base}${candidate} — ${error || "not found"}`);
    }
  }

  return null;
}

export async function POST(request: Request) {
  if (!await isAuthenticated(request)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { url, categoryId, cookie } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "请提供网址" }, { status: 400 });
    }

    // 1. Fetch the URL
    const fetchResult = await safeFetch(url, cookie);
    if (!fetchResult.ok) {
      const detail = fetchResult.error || `HTTP ${fetchResult.status}`;
      console.error(`[ai/ingest] fetch failed for "${url}": ${detail}`);
      return NextResponse.json({ error: `无法访问该网址: ${detail}` }, { status: 400 });
    }
    const html = fetchResult.text;

    // 2. Extract content — Readability first, fall back to simple text extraction
    const article = extractArticle(html, url);
    let pageTitle = "";
    let rawText = "";

    if (article && article.textContent.length > 100) {
      pageTitle = article.title;
      rawText = article.textContent;
    } else {
      // Readability failed — try simple HTML-to-text as fallback (works for SSR SPAs)
      const plainText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#\d+;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

      if (plainText.length > 50) {
        pageTitle = (titleMatch?.[1] || "").replace(/\s*[-–|].*$/, "").trim() || article?.title || "";
        rawText = plainText;
      } else {
        // 3. Both failed — try docsify fallback
        console.log(`[ai/ingest] Readability + text extraction both failed, trying docsify fallback...`);
        const fallback = await tryDocsifyFallback(html, url, cookie);
        if (!fallback) {
          return NextResponse.json({
            error: "无法从该网页提取有效内容。可能是页面需要登录、内容由 JS 动态加载、或为纯图片页面。",
          }, { status: 400 });
        }
        pageTitle = fallback.title;
        rawText = fallback.content;
      }
    }

    if (!rawText || rawText.length < 50) {
      return NextResponse.json({ error: "提取的内容太少，无法生成笔记" }, { status: 400 });
    }

    // 4. Call DeepSeek via skill template
    const result = await ingestUrl(url, pageTitle, rawText);

    if (!result.markdownContent) {
      return NextResponse.json({ error: "AI 未能生成笔记内容" }, { status: 500 });
    }

    // 5. Create source record
    const source = await createSource({
      url,
      title: pageTitle,
      summary: result.sourceSummary,
    });

    // 6. Create note as DRAFT — user reviews and publishes manually
    const note = await createNote({
      title: result.suggestedTitle,
      content: result.markdownContent,
      categoryId: categoryId || undefined,
      sourceId: source.id,
      status: "draft",
    });

    return NextResponse.json(note, { status: 201 });
  } catch (e: any) {
    console.error("[ai/ingest] error:", e.message);
    return NextResponse.json({ error: e.message || "摄入失败" }, { status: 500 });
  }
}
