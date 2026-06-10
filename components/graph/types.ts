export interface TagReference {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface GraphNode {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  tags: TagReference[];
  wordCount: number;
  linkCount: number;
  citationCount: number;
  summary?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  targetSlug: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Category color system for galaxy visualization
export const CATEGORY_COLORS: Record<string, { core: string; glow: string; label: string }> = {
  default:   { core: '#64b8ff', glow: 'rgba(100, 184, 255, 0.8)', label: '知识' },
  purple:    { core: '#c084fc', glow: 'rgba(192, 132, 252, 0.8)', label: '紫色' },
  blue:      { core: '#64b8ff', glow: 'rgba(100, 184, 255, 0.8)', label: '蓝色' },
  cyan:      { core: '#80ffea', glow: 'rgba(128, 255, 234, 0.8)', label: '青色' },
  gold:      { core: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)', label: '金色' },
  orange:    { core: '#fb923c', glow: 'rgba(251, 146, 60, 0.8)', label: '橙色' },
  green:     { core: '#4ade80', glow: 'rgba(74, 222, 128, 0.8)', label: '绿色' },
  red:       { core: '#f87171', glow: 'rgba(248, 113, 113, 0.8)', label: '红色' },
  pink:      { core: '#f472b6', glow: 'rgba(244, 114, 182, 0.8)', label: '粉色' },
};
