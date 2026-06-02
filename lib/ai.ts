const DEEPSEEK_BASE = "https://api.deepseek.com";
const MODEL = "deepseek-chat";

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
 * Generate a 1-2 sentence Chinese summary of a note (max 100 chars).
 */
export async function generateSummary(title: string, content: string): Promise<string> {
  const text = content.slice(0, 6000);
  const prompt = `请用 1-2 句中文总结以下笔记的核心内容，不超过 100 字。直接返回摘要文本。

标题：${title}

内容：
${text}`;

  const result = await chat(prompt, 200);
  return result.trim().slice(0, 200);
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

  const candidateList = candidates
    .map(c => `slug: ${c.slug}\ntitle: ${c.title}\n摘要: ${c.summary || "（无摘要）"}`)
    .join("\n\n---\n\n");

  const prompt = `你是一个知识库助手。给定一篇新笔记，从候选列表中找出与之最相关的已有笔记。

## 当前笔记
标题：${title}
摘要：${summary}

## 候选笔记
${candidateList}

## 要求
返回一个 JSON 数组，每项包含 slug、title、reason（用中文简短说明为什么相关，15字以内）。按关联度从高到低排序。只返回真正相关的。最多 10 条。

直接返回 JSON 数组，不要 markdown 代码块。`;

  const raw = await chat(prompt, 2000);
  const parsed = parseJsonArray(raw);
  return parsed.slice(0, 10);
}
