import { readFileSync, existsSync } from "fs";
import { join } from "path";

const DEEPSEEK_BASE = "https://api.deepseek.com";
const MODEL = "deepseek-chat";

// ─── Skill Template Loading ───

interface SkillMeta {
  name: string;
  description: string;
  variables?: string[];
  maxTokens?: number;
}

interface Skill {
  metadata: SkillMeta;
  body: string;
}

/** Read and parse a SKILL.md file from the skills/ directory */
export function loadSkill(name: string): Skill {
  const skillPath = join(process.cwd(), "skills", name, "SKILL.md");
  if (!existsSync(skillPath)) {
    throw new Error(`Skill "${name}" not found at ${skillPath}`);
  }

  const raw = readFileSync(skillPath, "utf-8");

  // Parse YAML frontmatter (between --- markers)
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error(`Skill "${name}" missing frontmatter`);
  }

  const frontmatterRaw = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  // Simple YAML parser for flat key-value + list
  const metadata: SkillMeta = { name: "", description: "" };
  let currentKey: string | null = null;

  for (const line of frontmatterRaw.split("\n")) {
    const kvMatch = line.match(/^(\w+):\s*(.*)/);
    const listMatch = line.match(/^\s+-\s+(.*)/);

    if (kvMatch) {
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();
      if (currentKey === "maxTokens") {
        (metadata as any)[currentKey] = parseInt(value) || 4000;
      } else if (currentKey === "variables") {
        // variables list handled below
      } else {
        (metadata as any)[currentKey] = value;
      }
    } else if (listMatch && currentKey === "variables") {
      if (!metadata.variables) metadata.variables = [];
      metadata.variables.push(listMatch[1].trim());
    }
  }

  return { metadata, body };
}

/** Replace {{variable}} placeholders in a template with actual values */
export function renderSkill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    return vars[name] ?? `{{${name}}}`;
  });
}

/** Parse a JSON object from DeepSeek response (strips markdown fences) */
function parseJsonObject(raw: string): any {
  try {
    const json = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(json);
    return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    console.warn("[ai] failed to parse JSON object:", raw.slice(0, 200));
    return {};
  }
}

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY not configured");
  return key;
}

async function chat(prompt: string, maxTokens = 2000): Promise<string> {
  const response = await fetch(`${DEEPSEEK_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "你是一个知识库助手。只返回纯文本，不要 markdown 代码块。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJsonArray(raw: string): any[] {
  try {
    const json = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn("[ai] failed to parse JSON:", raw.slice(0, 200));
    return [];
  }
}

/**
 * Generate a 3-5 sentence Chinese summary of a note (200-300 chars),
 * with key concepts bolded. Uses the summarize skill template.
 */
export async function generateSummary(title: string, content: string): Promise<string> {
  const skill = loadSkill("summarize");
  const text = content.slice(0, 8000);
  const prompt = renderSkill(skill.body, { title, content: text });

  const result = await chat(prompt, skill.metadata.maxTokens || 500);
  return result.trim().slice(0, 500);
}

interface SuggestResult {
  slug: string;
  title: string;
  reason: string;
}

/**
 * Use DeepSeek to rank candidates by relevance to the given note.
 * Candidates should include their pre-generated summaries for comparison.
 */
export async function suggestRelatedNotes(
  title: string,
  summary: string,
  candidates: { slug: string; title: string; summary: string }[],
): Promise<SuggestResult[]> {
  if (candidates.length === 0) return [];

  const skill = loadSkill("suggest-related");
  const candidateList = candidates
    .map(c => `slug: ${c.slug}\ntitle: ${c.title}\n摘要: ${c.summary || "（无摘要）"}`)
    .join("\n\n---\n\n");

  const prompt = renderSkill(skill.body, { title, summary, candidates: candidateList });

  const raw = await chat(prompt, skill.metadata.maxTokens || 2000);
  const parsed = parseJsonArray(raw);
  return parsed.slice(0, 10);
}

// ─── URL Ingestion ───

interface IngestResult {
  suggestedTitle: string;
  markdownContent: string;
  suggestedTags: string[];
  sourceSummary: string;
}

/**
 * Ingest a web page: load the ingest-url skill template, render it with the
 * URL's content, call DeepSeek, and parse the structured result.
 */
export async function ingestUrl(url: string, pageTitle: string, rawText: string): Promise<IngestResult> {
  const skill = loadSkill("ingest-url");
  const prompt = renderSkill(skill.body, {
    url,
    title: pageTitle,
    rawText: rawText.slice(0, 15000),
  });

  const raw = await chat(prompt, skill.metadata.maxTokens || 4000);
  const result = parseJsonObject(raw);

  return {
    suggestedTitle: result.suggestedTitle || pageTitle,
    markdownContent: result.markdownContent || "",
    suggestedTags: Array.isArray(result.suggestedTags) ? result.suggestedTags : [],
    sourceSummary: result.sourceSummary || "",
  };
}
