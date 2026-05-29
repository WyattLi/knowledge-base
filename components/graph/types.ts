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
