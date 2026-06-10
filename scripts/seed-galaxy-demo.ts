// Seed: import xingtu-demo data into MySQL
// Usage: npx tsx scripts/seed-galaxy-demo.ts

// Load .env manually (no dotenv dependency)
import { readFileSync } from "fs";
import { join } from "path";
try {
  const envContent = readFileSync(join(process.cwd(), ".env"), "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch (_) {}

import { db } from "../lib/db";
import { categories, tags, notes, noteContent, noteTags, noteLinks } from "../lib/schema";
import { v4 as uuid } from "uuid";

type NodeCategory = "technology" | "science" | "philosophy" | "art" | "history" | "life";

const CAT_LABELS: Record<NodeCategory, string> = {
  technology: "技术", science: "科学", philosophy: "哲学",
  art: "艺术", history: "历史", life: "生活",
};

const TAG_COLORS: Record<string, string> = {
  "前端": "#64b8ff", "框架": "#64b8ff", "UI": "#64b8ff",
  "编程语言": "#5ea0f0", "类型安全": "#5ea0f0", "开发效率": "#5ea0f0",
  "API": "#5090e0", "数据层": "#5090e0", "查询语言": "#5090e0",
  "设计": "#fb923c", "UI组件": "#fb923c", "一致性": "#fb923c",
  "物理": "#80ffea", "量子": "#80ffea", "微观世界": "#80ffea",
  "时空": "#60e8d4", "爱因斯坦": "#60e8d4",
  "宇宙": "#50d8c4", "天文": "#50d8c4", "起源": "#50d8c4",
  "AI": "#70e8d8", "深度学习": "#70e8d8", "算法": "#70e8d8",
  "意识": "#c084fc", "主观体验": "#c084fc", "难题": "#c084fc",
  "认知": "#b070f0", "思维": "#b070f0", "心智模型": "#b070f0",
  "古希腊": "#a060e8", "美德": "#a060e8", "内心平静": "#a060e8",
  "美学": "#fb923c", "视觉艺术": "#fb923c", "审美": "#fb923c",
  "音乐": "#f08030", "和声": "#f08030", "节奏": "#f08030",
  "历史": "#fbbf24", "文化": "#fbbf24", "欧洲": "#fbbf24",
  "数学": "#f0b020", "自然": "#f0b020", "美": "#f0b020",
  "生活方式": "#4ade80", "幸福": "#4ade80", "实践": "#4ade80",
  "效率": "#3cc870", "专注": "#3cc870", "工作方法": "#3cc870",
};

interface KNode {
  id: string; title: string; category: NodeCategory; tags: string[];
  summary: string; importance: number; connections: string[];
}

const nodes: KNode[] = [
  { id: "react", title: "React 组件化思想", category: "technology",
    tags: ["前端", "框架", "UI"],
    summary: `React 通过将 UI 拆分为可复用的组件，使得大型应用的开发和维护更加简洁。每个组件管理自己的状态，通过 props 向下传递数据，形成单向数据流。`,
    importance: 5, connections: ["typescript", "graphql", "design-system"] },
  { id: "typescript", title: "TypeScript 类型系统", category: "technology",
    tags: ["编程语言", "类型安全", "开发效率"],
    summary: `TypeScript 是 JavaScript 的超集，通过静态类型检查帮助开发者在编译期发现错误。类型推断、泛型和装饰器让代码更具表达力和安全性。`,
    importance: 4, connections: ["react", "design-system"] },
  { id: "graphql", title: "GraphQL 数据查询", category: "technology",
    tags: ["API", "数据层", "查询语言"],
    summary: `GraphQL 允许客户端精确指定所需数据，避免过度获取或欠获取。单一端点、类型系统和自省特性使其成为现代 API 设计的有力选择。`,
    importance: 3, connections: ["react", "machine-learning"] },
  { id: "design-system", title: "设计系统与组件库", category: "technology",
    tags: ["设计", "UI组件", "一致性"],
    summary: `设计系统是一套可共享的设计语言和组件库，确保产品的视觉一致性。它包含设计令牌、基础组件和使用规范，是设计与开发协作的桥梁。`,
    importance: 4, connections: ["react", "typescript", "art-and-beauty"] },
  { id: "quantum", title: "量子力学基础", category: "science",
    tags: ["物理", "量子", "微观世界"],
    summary: `量子力学描述微观粒子的行为规律，引入了波粒二象性、不确定性原理和叠加态等概念。薛定谔方程是量子力学的核心方程，描述量子态的时间演化。`,
    importance: 5, connections: ["relativity", "consciousness", "machine-learning"] },
  { id: "relativity", title: "相对论时空观", category: "science",
    tags: ["物理", "时空", "爱因斯坦"],
    summary: `狭义相对论指出光速恒定，时间和空间随速度变化而伸缩。广义相对论将引力描述为时空弯曲，预言了引力波、黑洞和宇宙膨胀等现象。`,
    importance: 5, connections: ["quantum", "cosmology"] },
  { id: "cosmology", title: "宇宙学与大爆炸", category: "science",
    tags: ["宇宙", "天文", "起源"],
    summary: `宇宙学研究宇宙的起源、演化和结构。大爆炸理论认为宇宙从138亿年前的奇点膨胀而来，暗物质和暗能量构成宇宙的大部分成分。`,
    importance: 4, connections: ["relativity", "philosophy-of-mind"] },
  { id: "machine-learning", title: "机器学习与神经网络", category: "science",
    tags: ["AI", "深度学习", "算法"],
    summary: `机器学习让计算机从数据中自动学习规律。深度神经网络通过多层非线性变换提取特征，在图像识别、自然语言处理和博弈游戏等领域取得突破。`,
    importance: 5, connections: ["quantum", "react", "consciousness"] },
  { id: "consciousness", title: "意识与心智哲学", category: "philosophy",
    tags: ["意识", "主观体验", "难题"],
    summary: `意识的"难问题"探讨为何物理过程能产生主观体验。从笛卡尔的二元论到当代物理主义，哲学家和科学家试图理解自我意识的本质与起源。`,
    importance: 4, connections: ["quantum", "machine-learning", "philosophy-of-mind", "stoicism"] },
  { id: "philosophy-of-mind", title: "认知科学与心智", category: "philosophy",
    tags: ["认知", "思维", "心智模型"],
    summary: `认知科学融合心理学、语言学、神经科学和计算机科学，研究心智的运作方式。心智模型、认知偏误和元认知是理解人类思维的重要概念。`,
    importance: 3, connections: ["consciousness", "cosmology", "stoicism"] },
  { id: "stoicism", title: "斯多葛哲学", category: "philosophy",
    tags: ["古希腊", "美德", "内心平静"],
    summary: `斯多葛哲学强调通过理性和美德追求内心平静。其核心是区分我们能控制的（意志、判断）和不能控制的（外部事件），专注于前者以获得真正的自由。`,
    importance: 4, connections: ["consciousness", "philosophy-of-mind", "art-of-living"] },
  { id: "art-and-beauty", title: "美学与艺术理论", category: "art",
    tags: ["美学", "视觉艺术", "审美"],
    summary: `美学探讨美的本质和艺术的价值。从柏拉图的"理念美"到现代的"表达理论"，美学为我们理解艺术创作和审美体验提供了哲学框架。`,
    importance: 3, connections: ["design-system", "music-theory", "stoicism"] },
  { id: "music-theory", title: "音乐理论与和声", category: "art",
    tags: ["音乐", "和声", "节奏"],
    summary: `音乐理论研究音乐的构成规律，包括音程、和弦、调性和节奏。西方古典和声学建立了一套严密的规则体系，是理解和创作音乐的基础。`,
    importance: 3, connections: ["art-and-beauty", "fibonacci"] },
  { id: "renaissance", title: "文艺复兴与人文主义", category: "history",
    tags: ["历史", "文化", "欧洲"],
    summary: `文艺复兴是14-17世纪欧洲的文化运动，以人文主义为核心，重新发现古希腊罗马文化。达芬奇、米开朗基罗等巨匠在艺术、科学和哲学上留下了不朽的遗产。`,
    importance: 4, connections: ["art-and-beauty", "fibonacci", "stoicism"] },
  { id: "fibonacci", title: "斐波那契数列与黄金比例", category: "history",
    tags: ["数学", "自然", "美"],
    summary: `斐波那契数列（1,1,2,3,5,8,13...）在自然界中广泛存在，从贝壳的螺旋到花瓣的排列。相邻项之比趋近黄金比例φ≈1.618，被艺术家视为美的数学基础。`,
    importance: 3, connections: ["renaissance", "music-theory", "cosmology"] },
  { id: "art-of-living", title: "生活的艺术", category: "life",
    tags: ["生活方式", "幸福", "实践"],
    summary: `生活的艺术探讨如何在日常生活中寻找意义和幸福。深度工作、心流体验、正念冥想和感恩练习是现代人构建有意义生活的实用工具。`,
    importance: 4, connections: ["stoicism", "philosophy-of-mind", "music-theory"] },
  { id: "deep-work", title: "深度工作与专注力", category: "life",
    tags: ["效率", "专注", "工作方法"],
    summary: `深度工作指在无干扰状态下进行认知要求高的任务。卡尔·纽波特认为，深度工作能力是信息经济时代最有价值的技能，需要刻意训练和保护。`,
    importance: 3, connections: ["art-of-living", "machine-learning"] },
];

function wordCount(text: string): number {
  return (text.match(/[一-鿿]/g) || []).length + (text.match(/[a-zA-Z]+/g) || []).length;
}

async function main() {
  console.log("Seeding galaxy demo data...\n");

  // 1. Categories
  const catIds: Record<string, string> = {};
  for (const [key, label] of Object.entries(CAT_LABELS)) {
    const id = `demo-cat-${key}`;
    catIds[key] = id;
    await db.insert(categories).values({ id, name: label, slug: key, enabled: true })
      .onDuplicateKeyUpdate({ set: { name: label, enabled: true } });
  }
  console.log(`Categories: ${Object.keys(catIds).length}`);

  // 2. Tags
  const tagSet = new Set<string>();
  nodes.forEach(n => n.tags.forEach(t => tagSet.add(t)));
  const tagIds: Record<string, string> = {};
  for (const name of tagSet) {
    const id = `demo-tag-${name}`;
    tagIds[name] = id;
    await db.insert(tags).values({
      id, name, slug: name, color: TAG_COLORS[name] || "#6366f1", enabled: true,
    }).onDuplicateKeyUpdate({ set: { name, color: TAG_COLORS[name] || "#6366f1", enabled: true } });
  }
  console.log(`Tags: ${tagSet.size}`);

  // 3. Notes + note_content
  const noteIds: Record<string, string> = {};
  for (const n of nodes) {
    const noteId = `demo-note-${n.id}`;
    noteIds[n.id] = noteId;
    await db.insert(notes).values({
      id: noteId, title: n.title, slug: `demo-${n.id}`,
      categoryId: catIds[n.category], cosKey: `demo/${n.id}.md`,
      wordCount: wordCount(n.summary), status: "published",
    }).onDuplicateKeyUpdate({ set: { title: n.title, status: "published" } });
    await db.insert(noteContent).values({
      noteId, plainText: n.summary, summary: n.summary, rawMarkdown: n.summary,
    }).onDuplicateKeyUpdate({ set: { plainText: n.summary, summary: n.summary, rawMarkdown: n.summary } });
  }
  console.log(`Notes: ${nodes.length}`);

  // 4. Note-tags (ignore duplicates via try/catch)
  let tc = 0;
  for (const n of nodes) {
    for (const t of n.tags) {
      try {
        await db.insert(noteTags).values({ noteId: noteIds[n.id], tagId: tagIds[t] });
        tc++;
      } catch (_) { /* duplicate, skip */ }
    }
  }
  console.log(`Note-tags: ${tc}`);

  // 5. Note links (bidirectional, ignore duplicates)
  let lc = 0;
  const seenLinks = new Set<string>();
  for (const n of nodes) {
    for (const cid of n.connections) {
      const src = noteIds[n.id];
      const tgt = noteIds[cid];
      if (!tgt) continue;
      const key1 = `${src}->${tgt}`;
      const key2 = `${tgt}->${src}`;
      if (!seenLinks.has(key1)) {
        seenLinks.add(key1);
        try {
          await db.insert(noteLinks).values({ id: uuid(), sourceNoteId: src, targetNoteId: tgt, targetSlug: `demo-${cid}` });
          lc++;
        } catch (_) { /* dup */ }
      }
      if (!seenLinks.has(key2)) {
        seenLinks.add(key2);
        try {
          await db.insert(noteLinks).values({ id: uuid(), sourceNoteId: tgt, targetNoteId: src, targetSlug: `demo-${n.id}` });
          lc++;
        } catch (_) { /* dup */ }
      }
    }
  }
  console.log(`Links: ${lc} (bidirectional)`);

  console.log(`\nDone! ${nodes.length} nodes imported.`);
}

main().catch(e => { console.error(e); process.exit(1); });
