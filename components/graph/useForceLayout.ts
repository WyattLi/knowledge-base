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

interface LayoutResult {
  nodePositions: Map<string, [number, number, number]>;
  edgeWeights: Map<string, number>;
}

function fibonacciSphere(n: number, radius: number): [number, number][] {
  const points: [number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    points.push([Math.cos(theta) * r * radius, Math.sin(theta) * r * radius]);
  }
  return points;
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

    const tagGroups = new Map<string, string[]>();
    for (const node of data.nodes) {
      for (const tag of node.tags) {
        if (!tagGroups.has(tag.id)) tagGroups.set(tag.id, []);
        tagGroups.get(tag.id)!.push(node.id);
      }
    }

    const tagEdges: { source: string; target: string }[] = [];
    for (const [, members] of tagGroups) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const key = [members[i], members[j]].sort().join("::");
          if (!edgeWeights.has(key)) {
            tagEdges.push({ source: members[i], target: members[j] });
          }
        }
      }
    }

    const initialPositions = fibonacciSphere(data.nodes.length, 10);
    const posMap = new Map<string, { x: number; y: number }>();
    data.nodes.forEach((n, i) => {
      const [px, py] = initialPositions[i];
      posMap.set(n.id, { x: px, y: py });
    });

    const sim = forceSimulation(
      data.nodes.map(n => ({ id: n.id, x: posMap.get(n.id)!.x, y: posMap.get(n.id)!.y }))
    )
      .force("link", forceLink(simEdges).id((d: any) => d.id).distance(4).strength(0.5))
      .force("charge", forceManyBody().strength(-60))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide(1.5))
      .stop();

    if (tagEdges.length > 0) {
      sim.force("tagLink", forceLink(tagEdges).id((d: any) => d.id).distance(8).strength(0.05));
    }

    for (let i = 0; i < 300; i++) sim.tick();

    const nodePositions = new Map<string, [number, number, number]>();
    for (const node of sim.nodes()) {
      const n = data.nodes.find(dn => dn.id === node.id);
      const citationHeight = n ? n.citationCount * 0.6 : 0;
      const jitter = (Math.random() - 0.5) * 0.3;
      nodePositions.set(node.id as string, [node.x || 0, citationHeight + jitter, node.y || 0]);
    }

    return { nodePositions, edgeWeights, ready: true };
  }, [data]);
}
