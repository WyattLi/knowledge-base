---
name: background-v1-blue-nebula
description: V1 背景方案 — 蓝色星云 + 密集星场，已提交 git f665d21
metadata:
  type: project
---

## V1 背景方案（当前）

**git commit**: `f665d21` — `v1: 蓝色星云+密集星场背景，移除地球弧面`

### 核心特征
- 深海军蓝底色 `#010712`
- 蓝色星云（`#0f4874` → `#22d3ee` 范围），screen 混合模式
- 密集星场：CosmicBackground ~600-1100 远景星 + ~100-170 近景亮星
- 无地球弧面
- 暗色主题默认

### 关键文件及状态
| 文件 | 要点 |
|------|------|
| `components/background/CosmicBackground.tsx` | Canvas 动画背景，8 个蓝色星云 blob，600+ 远景星，100+ 近景星带光晕，4 颗流星，无 Earth 代码 |
| `components/background/GalaxyPageBackground.tsx` | 静态 CSS 背景，8 层蓝色径向渐变，120 颗 CSS 星光 |
| `components/graph/GalaxyCanvas.tsx` | 6 个蓝色星云层，500 背景星，canvas 填充 `#010712` |
| `app/globals.css` | 暗色主题 `--bg-primary: #010712`，body 两个中央蓝色星云渐变 |
| `components/theme/ThemeProvider.tsx` | 默认暗色主题 |
| `app/explore/ExplorePageClient.tsx` | 星图容器背景 `#010712` |

### 回滚方式
```bash
git checkout f665d21 -- components/background/CosmicBackground.tsx components/background/GalaxyPageBackground.tsx components/graph/GalaxyCanvas.tsx app/globals.css app/explore/ExplorePageClient.tsx
```
