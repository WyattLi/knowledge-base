# Knowledge Base — 全栈知识管理系统 PRD

## Context

构建一个基于 Next.js 的 AI 驱动个人知识管理系统，部署在 EdgeOne Pages 上。

**核心理念**（借鉴 Karpathy 的 LLM Wiki 思想）：AI 是 Wiki 的主要维护者，人类负责策展来源、提出问题和思考意义。知识库是不断复合增长的有机体 —— 每摄入一个新的原始资料、每提出一个好的问题，答案都会被归档到 Wiki 中，让知识库越来越丰富。

核心功能：3D 知识星图首页、在线 Markdown 编辑、标签/分类组织、双向链接、全文搜索、AI 自动分析标注与内容生成、简单密码认证（游客只读，登录后可管理）、原始资料摄入与 AI 摘要。

## Tech Stack

| 层 | 选型 | 说明 |
|---|---|---|
| 框架 | Next.js 14 (App Router) | EdgeOne Pages 自动检测部署 |
| 语言 | TypeScript | 全栈类型安全 |
| 样式 | Tailwind CSS | 快速构建 UI |
| ORM | Drizzle ORM | 轻量、serverless 友好、类型安全 |
| 数据库 | TDSQL-C Serverless (MySQL) | 腾讯云，serverless 自动暂停，低成本 |
| 文件存储 | 腾讯云 COS | Markdown 源文件存储 |
| AI | DeepSeek API (openai SDK) | 自动分析笔记内容，建议分类/标签 |
| 部署 | EdgeOne Pages | 全栈模式，API Routes 自动转为云函数 |
| 开发环境 | windows 11


## Architecture

### 三层架构（借鉴 LLM Wiki）

```
┌─────────────────────────────────────────┐
│  Schema（CLA.md / PRD.md）              │
│  定义 Wiki 结构、命名约定、AI 工作流     │
│  人类与 AI 共同演进                      │
├─────────────────────────────────────────┤
│  Wiki（笔记 + AI 生成内容）              │
│  AI 主动维护：创建、更新、交叉引用、     │
│  标记矛盾、生成摘要                      │
│  人类浏览和策展                          │
├─────────────────────────────────────────┤
│  原始资料（COS sources/）                │
│  不可变参考材料：文章、论文、网页剪藏、   │
│  图片、书本章节                          │
│  AI 读取但绝不修改                       │
└─────────────────────────────────────────┘
```

### Storage Split

- **COS** — Markdown 源文件（可导出、备份）
- **TDSQL-C** — 元数据（标题、标签、分类、链接）+ 全文搜索内容副本
- 每次保存：写入 COS → 更新 DB 元数据 → 解析链接 → 更新搜索索引

### Authentication

- 在 `.env` 中配置 `ACCESS_PASSWORD`，服务端读取验证
- **游客（未登录）**：只能浏览，可查看笔记列表、笔记内容、搜索、标签/分类浏览
- **登录后**：完整管理权限 — 创建/编辑/删除笔记、管理标签/分类、触发 AI 分析
- 登录态通过 HTTP-only cookie（JWT）维护，有效期 7 天
- 前端：Navbar 显示登录按钮或已登录状态；管理类按钮仅在登录后可见
- API 层：写操作接口（POST/PUT/DELETE）校验 cookie，未登录返回 401
- 登录 API：`POST /api/auth/login` 接收密码，验证通过后设置 cookie

### 视觉主题：深空宇宙

整体 UI 呈现深邃太空的视觉风格：
- **配色**：深空黑底 (`#0a0a0f`)，星点白/淡蓝，星云紫 (`#7c3aed`) 点缀，文字使用低亮度暖白
- **背景**：三层粒子系统 — 远星（静止微点）、近星（缓慢漂移）、流星（偶尔划过）
- **排版**：等宽/无衬线字体，半透明面板（毛玻璃效果），边框微光
- **氛围**：整体暗色，交互元素发出柔和光芒（glow），模仿星辰

### 首页：知识星图

游客进入首页后看到一片璀璨的星空，每颗星星代表一篇 Markdown 笔记。

**星图特性**：
- 笔记节点渲染为发光星点，亮度/大小代表笔记的"重要程度"（引用越多越亮越大）
- 有双向链接关联的笔记之间出现星光连线（beam），连线粗细和亮度反映链接强度
- 标签相同的笔记之间也有较弱的光晕连线，表示主题相关性
- 支持拖拽平移、滚轮缩放、点击星星
- 点击星星 → 镜头飞行靠近 → 弹出笔记预览卡片（标题、摘要、标签）
- 悬停星星 → 高亮该节点及其所有连线，其他节点变暗

**星图布局算法**：
- 使用 3D 力导向图（force-directed graph），关联笔记互相吸引，无关联笔记互相排斥
- 初始布局在类球形区域内，模拟星系结构
- 有大量关联的笔记会形成"星团"（cluster），体现知识群落

**技术实现（v1）**：
- 使用 `react-three-fiber` (Three.js React 封装) 实现 3D 星空
- 力导向布局由 `d3-force` 计算节点坐标
- 通过 Sidebar 可切换到传统列表视图查看

### 特殊文件：index.md 与 log.md

两个 AI 自动维护的特殊文件，帮助人类和 AI 共同导航知识库：

**index.md** — 内容目录。按分类列出每篇 Wiki 页面，附带一句话摘要和最后更新时间。AI 在每次操作后更新它。回答问题时 AI 先读 index 定位相关页面再深入。中等规模（数百页面）下可以替代 RAG。

**log.md** — 操作日志。仅追加的时间线记录，格式统一（`## [日期] 操作类型 | 标题`），可用 `grep` 解析。记录每次摄入、笔记变更、AI 分析、Lint 检查。让 AI 了解最近的上下文。

### Data Model (8 tables)

```
notes          — 笔记元数据 (id, title, slug, cosKey, categoryId, contentHash, status, sourceId)
categories     — 分类（支持父子层级，self-ref FK）
tags           — 标签 (id, name, slug, color)
note_tags      — 笔记-标签多对多关联
note_links     — 双向链接 (sourceNoteId, targetNoteId, targetSlug, context)
note_content   — 纯文本搜索内容 (noteId, plainText, rawMarkdown)
sources        — 原始资料 (id, title, url, cosKey, type, ingestedAt, summary)
operation_logs — 操作日志 (id, timestamp, type, title, description, relatedNoteIds)
```

关键设计：
- `noteLinks.targetNoteId` 可为 null，指向还不存在的笔记（待解析链接）
- `noteContent` 重复存储 Markdown，用于 MySQL 全文索引（ngram parser 支持中文）
- `aiTagsJson` / `aiCategorySuggestion` 存储 AI 建议，与用户确认后的标签分开
- `notes.sourceId` 可选关联到原始资料，追溯笔记的信息来源
- `sources` 存储不可变的原始参考资料（网页、论文、书本章节等）
- `operation_logs` 记录所有操作的时间线，供 AI 了解上下文

### API Routes (app/api/)

🔓 = 游客可访问 / 🔐 = 需要登录

```
🔓 GET     /api/notes                列表
🔐 POST    /api/notes                创建
🔓 GET     /api/notes/[slug]         查看单篇
🔐 PUT     /api/notes/[slug]         编辑
🔐 DELETE  /api/notes/[slug]         删除
🔓 GET     /api/tags                 标签列表
🔐 POST    /api/tags                 创建标签
🔐 PUT     /api/tags/[id]            编辑标签
🔐 DELETE  /api/tags/[id]            删除标签
🔓 GET     /api/categories           分类列表
🔐 POST    /api/categories           创建分类
🔐 PUT     /api/categories/[id]      编辑分类
🔐 DELETE  /api/categories/[id]      删除分类
🔓 GET     /api/search?q=keyword     全文搜索
🔓 GET     /api/links?noteId=xxx     获取链接/反向链接
🔓 POST    /api/auth/login           密码登录
🔓 POST    /api/auth/logout          退出登录
🔓 GET     /api/auth/status          查询登录状态
🔐 POST    /api/sources              添加原始资料（URL 或文本粘贴）
🔓 GET     /api/sources              原始资料列表
🔐 POST    /api/ai/ingest            AI 摄入资料 → 生成摘要+更新关联页面
🔐 POST    /api/ai/analyze           AI 分析单篇笔记
🔐 POST    /api/ai/analyze/batch     AI 批量分析
🔓 POST    /api/ai/query             AI 问答（基于 Wiki 内容的回答+引用）
🔐 POST    /api/ai/lint              AI 体检（检查矛盾、孤立页、过期内容）
```

### Component Tree

```
RootLayout (AuthProvider, CosmicBackground)
  Navbar (SearchBar, new note btn [🔐], ingest btn [🔐], login/logout btn, 视图切换)
  Sidebar (CategoryTree, TagManager)
  LoginModal (密码输入框，登录状态由 AuthContext 管理)
  Main:
    /                    → StarField (3D 知识星图) + NotePreviewCard (悬停/点击弹出)
    /notes               → NoteList 传统列表视图
    /notes/[slug]        → NoteViewer + BacklinksPanel + AIAnalyzeSection
    /notes/[slug]/edit   → MarkdownEditor (split-pane) + NoteMetaEditor [🔐]
    /search?q=           → SearchResults
    /tags/[slug]         → Filtered NoteList
    /sources             → SourceList（原始资料列表）
    /sources/new         → SourceIngestForm（URL/文本摄入表单）[🔐]
    /query               → AIQueryPanel（对知识库提问，游客也可用）
    /lint                → LintReport（AI 体检报告）[🔐]

CosmicBackground 作为全局背景层，渲染三层粒子星空。
StarField 是首页的核心组件，使用 react-three-fiber 渲染 3D 星图。
```

### Key Libraries

- `drizzle-orm` + `mysql2` — 数据库
- `cos-nodejs-sdk-v5` — COS 文件操作
- `react-markdown` + `remark-gfm` — Markdown 渲染
- `@uiw/react-md-editor` — 编辑器组件
- `openai` — 调用 DeepSeek API
- `sonner` — Toast 通知
- `next-themes` — 暗色模式
- `jose` — JWT 签发与验证（Edge-compatible，无 Node.js crypto 依赖）
- `bcryptjs` — 密码哈希（纯 JS 实现，Edge-compatible）
- `three` + `@react-three/fiber` + `@react-three/drei` — 3D 星空渲染
- `d3-force` — 力导向图布局算法，计算节点坐标

### Bidirectional Links

- 正则 `/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g` 解析 `[[target]]` 和 `[[target|alias]]`
- 保存时：提取链接 → 查找目标笔记 → 写入 `note_links` 表
- 渲染时：预处理替换为标准 MD 链接，已有笔记正常链接，未解析的提示"创建"
- 反向链接面板：查询 `WHERE targetNoteId = currentNoteId`

### Full-Text Search

- MySQL 8.0 FULLTEXT INDEX + **ngram parser**（支持中文分词）
- NATURAL LANGUAGE MODE 查询，按相关度排序
- 零额外成本，无需额外服务

### AI 操作：Ingest / Query / Lint / Analyze

AI 是 Wiki 的主要维护者，四种核心操作：

**1. Ingest（摄入）** `POST /api/ai/ingest`
- 用户提交一份原始资料（URL、粘贴文本或上传文件），AI 执行：
  1. 读取并理解资料内容
  2. 生成摘要页存入 Wiki（`notes` 表，关联 `sourceId`）
  3. 提取关键实体和概念，更新或创建对应的 Wiki 页面
  4. 建立交叉引用（`[[link]]`）
  5. 标记与已有笔记的矛盾或补充关系
  6. 更新 `index.md`
  7. 追加记录到 `log.md`
- 一次摄入可能触及 10-15 个 Wiki 页面

**2. Query（问答）** `POST /api/ai/query`
- 用户对知识库提问，AI 执行：
  1. 读取 `index.md` 定位相关页面
  2. 深入阅读相关页面内容
  3. 综合多页面信息生成答案，附带引用来源
  4. 好答案可一键"归档到 Wiki"（调用创建笔记接口）
- 这样探索性提问不会消失在聊天记录中，而是复合进知识库

**3. Lint（体检）** `POST /api/ai/lint`
- 定期对 Wiki 进行健康检查，AI 检查：
  - 页面之间的内容矛盾
  - 被新信息取代的过期声明
  - 没有入链的孤立页面
  - 提到但缺少独立页面的重要概念
  - 缺失的交叉引用
- 生成体检报告，列出建议修复项

**4. Analyze（分析）** `POST /api/ai/analyze`
- 对单篇笔记进行轻量分析：建议分类 + 2-5 个标签 + 一句话摘要
- 前端展示 AI 建议 chips，用户点击确认/忽略
- 缓存：通过 `contentHash` 去重，相同内容不重复分析

## Implementation Phases

### Phase 1 — 基础设施
1. 初始化 Next.js 项目 (TypeScript + Tailwind)
2. 配置 Drizzle ORM，编写 8 张表 schema，执行迁移
3. 实现 COS 客户端封装 (`lib/cos.ts`)
4. 搭建全局 CosmicBackground（三层粒子星空）+ 深空主题 CSS 变量
5. 实现认证系统 (`/api/auth/*`, JWT 中间件, AuthContext, LoginModal)
6. 实现 `/api/notes` 基础 CRUD（写操作加 auth 校验）
7. 搭建 NoteEditor + NoteViewer + NoteList 组件

### Phase 2 — 知识星图
8. 实现 `d3-force` 节点坐标计算服务
9. 使用 `react-three-fiber` 渲染 3D 星图（发光星点 + 连线光束）
10. 实现镜头交互（拖拽/缩放/飞行/悬停高亮）
11. 实现 NotePreviewCard（星点点击弹出预览）

### Phase 3 — 组织与链接
12. 标签 CRUD (API + UI：TagBadge, TagSelector, TagManager)
13. 分类 CRUD (API + UI：CategoryTree, CategorySelector)
14. `[[wikilink]]` 解析、存储、渲染 + 反向链接面板
15. 星图过滤联动 + 传统列表视图

### Phase 4 — AI Wiki 维护
16. 原始资料摄入 API + UI（SourceIngestForm, SourceList）
17. AI Ingest：摄入资料 → 生成摘要 + 更新关联页面 + 交叉引用
18. AI Query：对知识库问答 + 答案归档
19. AI Analyze：单篇/批量标签建议
20. index.md / log.md 自动维护

### Phase 5 — 搜索与 Lint
21. MySQL 全文索引迁移 + 搜索 API + 搜索页面
22. AI Lint：Wiki 健康体检 + 体检报告页面

### Phase 6 — 上线
23. `edgeone.json` 配置
24. 响应式适配、交互打磨
25. 部署到 EdgeOne Pages

## Verification

- `npm run dev` 启动开发服务器，游客状态下确认只能浏览，管理按钮不显示
- 输入错误密码，确认拒绝登录；正确密码，确认登录成功
- 登录后验证笔记 CRUD 全流程（创建→编辑→删除）
- 创建含 `[[link]]` 的笔记，确认链接解析和反向链接显示
- 搜索中文关键词，验证 ngram 分词效果
- 触发 AI 分析，确认返回合理的标签/分类建议
- Cookie 过期后确认自动退出登录
- 首页星图渲染正常，节点位置合理，关联笔记之间有连线
- 悬停星点确认高亮关联节点，点击星点确认弹出预览卡片
- 创建新的 `[[link]]` 后确认星图出现新连线
- 摄入一篇网页文章，确认 AI 生成摘要页 + 更新关联笔记 + index.md/log.md 更新
- 在 Query 页面对知识库提问，确认返回带引用的综合回答
- 将 Query 答案归档到 Wiki，确认页面正确创建
- 运行 Lint，确认发现孤立页面和缺失交叉引用
- `npx edgeone pages deploy` 部署并验证线上功能
