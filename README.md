# Knowledge Base — AI 驱动的个人知识管理系统

一个基于 Next.js 的个人知识管理工具，支持 Markdown 笔记编辑、双向链接、知识图谱可视化，以及 DeepSeek AI 驱动的智能摘要、关联推荐和网址摄入。

## ✨ 功能

### 笔记管理
- **Markdown 编辑器** — 分栏实时预览、工具栏（加粗/斜体/代码/图片/链接）、图片粘贴上传
- **双向链接** — `[[笔记标题]]` 语法自动解析，详情页展示出链和反向链接
- **分类树** — 无限层级分类，侧边栏单选筛选，点击父分类递归包含子分类
- **标签系统** — 多彩标签，侧边栏多选筛选，选中态视觉反馈
- **草稿/发布** — 笔记状态管理

### AI 能力 (DeepSeek)
- **AI 摘要** — 自动生成 200-300 字中文摘要，关键概念加粗，支持手动触发生成和编辑
- **AI 联想** — 两阶段推荐：本地关键词+标签+分类打分预筛选 → AI 精排，已链接笔记自动去重
- **网址摄入** — 输入 URL → 自动抓取网页 → AI 阅读生成结构化 Markdown 笔记

### 可视化
- **2D 知识图谱** — Canvas 渲染星图，节点拖拽/缩放/搜索，分类和标签筛选
- **双主题** — 暗色宇宙星云 + 暖灰浅色，一键切换

### 管理后台
- 分类、标签的完整 CRUD，带表单验证和错误提示

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 数据库 | MySQL + Drizzle ORM |
| Blob 存储 | EdgeOne Pages Blob |
| AI | DeepSeek API (deepseek-chat) |
| 认证 | JWT (jose) |
| 样式 | Tailwind CSS v4 |
| 图谱 | Canvas 2D + d3-force 力导向布局 |
| Markdown | react-markdown + remark-gfm + highlight.js |
| 内容提取 | @mozilla/readability + jsdom |

## 🚀 快速开始

### 前提条件

- Node.js 18+
- MySQL 数据库
- DeepSeek API Key（AI 功能需要）

### 安装

```bash
git clone https://github.com/WyattLi/knowledge-base.git
cd knowledge-base
npm install
```

### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

```env
DATABASE_URL=mysql://user:password@host:3306/knowledge-base
ACCESS_PASSWORD=your-login-password
JWT_SECRET=your-jwt-secret
DEEPSEEK_API_KEY=sk-your-deepseek-api-key

# 可选 — EdgeOne Pages Blob（不配置则使用本地模拟）
# EDGEONE_PROJECT_ID=pages-xxx
# EDGEONE_BLOB_TOKEN=your-api-token
```

### 初始化数据库

```bash
npx drizzle-kit push
```

### 启动

```bash
npm run dev
```

访问 `http://localhost:3000`。

## 📁 项目结构

```
├── app/                    # Next.js App Router
│   ├── api/                # 16 个 API 路由
│   │   ├── ai/             # ingest, summarize, suggest
│   │   ├── auth/           # login, logout, status
│   │   ├── blob/           # [...key]
│   │   ├── categories/     # CRUD
│   │   ├── graph/          # 图谱数据
│   │   ├── maintenance/    # 批量生成摘要
│   │   ├── notes/          # CRUD
│   │   ├── tags/           # CRUD
│   │   └── upload/         # 图片上传
│   ├── admin/              # 管理后台
│   ├── explore/            # 知识图谱首页
│   ├── notes/              # 笔记列表/详情/编辑/新建
│   └── sources/            # 网址摄入
├── components/             # React 组件
│   ├── layout/             # AppShell, Navbar, Sidebar
│   ├── graph/              # GraphCanvas, NoteDetailPanel
│   ├── notes/              # NoteEditor, MarkdownRenderer, AiSuggestPanel
│   ├── admin/              # AdminTabs, AdminGuard
│   ├── auth/               # AuthContext, LoginModal
│   ├── categories/         # CategoryTree
│   ├── tags/               # TagManager
│   ├── theme/              # ThemeProvider
│   └── ui/                 # Button, Input, Modal
├── lib/                    # 核心业务逻辑
│   ├── ai.ts               # DeepSeek 调用、Skill 模板加载
│   ├── auth.ts             # JWT 认证
│   ├── blob.ts             # Blob 存储抽象
│   ├── categories.ts       # 分类 CRUD + 路径计算
│   ├── db.ts               # 数据库连接
│   ├── graph.ts            # 图谱数据查询
│   ├── notes.ts            # 笔记 CRUD + 链接解析 + 候选预筛选
│   ├── schema.ts           # Drizzle ORM 数据模型 (8 张表)
│   └── tags.ts             # 标签 CRUD
├── skills/                 # AI 提示词模板 (Skill 系统)
│   ├── summarize/           # 笔记摘要生成
│   ├── suggest-related/     # 关联笔记推荐
│   └── ingest-url/          # 网址摄入
└── drizzle/                # 数据库迁移
```

## 🗄 数据模型

| 表 | 说明 | 关键字段 |
|------|------|------|
| `categories` | 层级分类（自引用） | name, slug, parentId |
| `tags` | 标签 | name, slug, color |
| `notes` | 笔记元数据 | slug, categoryId, status, cosKey |
| `note_content` | 笔记正文+摘要 (1:1) | plainText, summary, rawMarkdown |
| `note_tags` | 笔记-标签关联 (M:N) | noteId, tagId |
| `note_links` | 双向链接 | sourceNoteId, targetNoteId, targetSlug |
| `sources` | 参考来源 | url, type |
| `operation_logs` | 操作日志 | type, title, relatedNoteIds |

## 🔑 认证

单密码认证模式：输入密码 → 服务端签发 JWT（httpOnly Cookie，7 天有效）。所有写操作 API 需登录。

## 📝 AI Skill 系统

AI 功能通过 Skill 模板驱动（`skills/*/SKILL.md`），每个 Skill 是一个带 YAML 前言的 Markdown 模板，通过 `{{变量}}` 注入数据后发送给 DeepSeek：

```
skills/
├── summarize/SKILL.md       # 笔记摘要 (maxTokens: 500)
├── suggest-related/SKILL.md # 关联推荐 (maxTokens: 2000)
└── ingest-url/SKILL.md      # 网址摄入 (maxTokens: 4000)
```

`lib/ai.ts` 中的 `loadSkill()` + `renderSkill()` 负责加载和渲染模板。

## 📄 License

MIT
