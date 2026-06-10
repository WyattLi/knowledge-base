"use client";

import { useMemo } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force";
import type { GraphData } from "./types";

export interface LayoutResult {
  nodePositions: Map<string, [number, number, number]>;
  edgeWeights: Map<string, number>;
}

function hashZ(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  }
  return ((h % 100) / 100) * 160 - 80;
}

export function useForceLayout(data: GraphData | null): LayoutResult & { ready: boolean } {
  return useMemo(() => {
    if (!data || data.nodes.length === 0) {
      return { nodePositions: new Map(), edgeWeights: new Map(), ready: true };
    }

    const nodeIds = new Set(data.nodes.map(n => n.id));
    const edges = data.edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    const edgeWeights = new Map<string, number>();
    for (const e of edges) {
      const key = [e.source, e.target].sort().join("::");
      edgeWeights.set(key, (edgeWeights.get(key) || 0) + 1);
    }

    const simEdges = edges.map(e => ({ source: e.source, target: e.target }));

    // Tag group attraction (capped)
    const tagGroups = new Map<string, string[]>();
    for (const node of data.nodes) {
      for (const tag of node.tags) {
        if (!tagGroups.has(tag.id)) tagGroups.set(tag.id, []);
        tagGroups.get(tag.id)!.push(node.id);
      }
    }
    const tagEdges: { source: string; target: string }[] = [];
    for (const [, members] of tagGroups) {
      const limit = Math.min(members.length, 15);
      for (let i = 0; i < limit; i++) {
        for (let j = i + 1; j < limit; j++) {
          const key = [members[i], members[j]].sort().join("::");
          if (!edgeWeights.has(key)) tagEdges.push({ source: members[i], target: members[j] });
        }
      }
    }

    // 2D circular initial positions
    const radius = Math.sqrt(data.nodes.length) * 8;
    data.nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / data.nodes.length;
      (n as any)._ix = Math.cos(angle) * radius;
      (n as any)._iy = Math.sin(angle) * radius;
    });

    const sim = forceSimulation(
      data.nodes.map(n => ({ id: n.id, x: (n as any)._ix, y: (n as any)._iy }))
    )
      .force("link", forceLink(simEdges).id((d: any) => d.id).distance(120).strength(0.1))
      .force("charge", forceManyBody().strength(-400))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide(15))
      .stop();

    if (tagEdges.length > 0) {
      sim.force("tagLink", forceLink(tagEdges).id((d: any) => d.id).distance(35).strength(0.06));
    }

    for (let i = 0; i < 300; i++) sim.tick();

    const nodePositions = new Map<string, [number, number, number]>();
    for (const node of sim.nodes()) {
      const z = hashZ(node.id as string);
      nodePositions.set(node.id as string, [node.x || 0, node.y || 0, z]);
    }

    return { nodePositions, edgeWeights, ready: true };
  }, [data]);
}
