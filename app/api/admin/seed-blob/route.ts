import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getStore } from "@edgeone/pages-blob";

const STORE_NAME = "notes-content";

const sampleFiles: Record<string, string> = {
  "notes/getting-started.md": `# 开始使用知识库

欢迎使用 AI 驱动的个人知识管理系统。

## 核心功能

- **笔记管理**：创建、编辑、组织你的笔记
- **标签分类**：通过标签和分类整理知识
- **知识星图**：3D 可视化浏览知识关联

## 使用提示

1. 点击导航栏的「新建」创建第一篇笔记
2. 使用标签给笔记分类
3. 在「知识星图」中探索笔记之间的关联
`,
  "notes/markdown-guide.md": `# Markdown 语法参考

## 标题

使用 # 号表示标题层级：

# 一级标题
## 二级标题
### 三级标题

## 文本样式

**粗体** *斜体* ~~删除线~~

## 链接

[访问知识库](/notes)

## 列表

- 无序列表项
- 另一个列表项

1. 有序列表项
2. 第二个有序项
`,
  "notes/architecture.md": `# 技术架构

## 技术栈

- **框架**: Next.js 16 (App Router)
- **数据库**: MySQL (TDSQL-C Serverless)
- **ORM**: Drizzle ORM
- **存储**: EdgeOne Pages Blob
- **可视化**: Three.js + react-three-fiber + d3-force

## 部署架构

\`\`\`
浏览器 → EdgeOne CDN → Pages Functions → MySQL / Blob
\`\`\`

## 存储策略

- 笔记元数据（标题、标签、状态等）→ MySQL
- 笔记 Markdown 内容 → EdgeOne Pages Blob
`,
};

export async function POST(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const store = getStore(STORE_NAME);
  const results: string[] = [];

  for (const [key, content] of Object.entries(sampleFiles)) {
    try {
      await store.set(key, content);
      const verify = await store.get(key);
      results.push(verify ? `OK: ${key}` : `VERIFY FAIL: ${key}`);
    } catch (e: any) {
      results.push(`FAIL: ${key} — ${e.message}`);
    }
  }

  return NextResponse.json({ results });
}
