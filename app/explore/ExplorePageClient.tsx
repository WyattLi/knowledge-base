// 知识星系页面 — 客户端组件
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Sparkles, RotateCcw, ZoomIn, ZoomOut, Info } from 'lucide-react';
import GalaxyCanvas, { buildGalaxyNodes } from '@/components/graph/GalaxyCanvas';
import { NoteDetailPanel } from '@/components/graph/NoteDetailPanel';
import CategoryLegend, { type CategoryLegendEntry } from '@/components/graph/CategoryLegend';
import SpotlightCursor from '@/components/graph/SpotlightCursor';
import { useGraphData } from '@/components/graph/useGraphData';
import { useForceLayout } from '@/components/graph/useForceLayout';
import type { GraphNode } from '@/components/graph/types';

export function ExplorePageClient({ categoryId, tagId }: { categoryId?: string; tagId?: string }) {
  const { data, loading, error } = useGraphData({ categoryId, tagId });
  const { nodePositions, edgeWeights: _edgeWeights, ready } = useForceLayout(data);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showTip, setShowTip] = useState(true);

  // Build galaxy nodes from API data
  const allGalaxyNodes = useMemo(() => {
    if (!data || !ready) return [];
    return buildGalaxyNodes(data.nodes, nodePositions, data.edges);
  }, [data, nodePositions, ready]);

  // Filter by category (tag color) if active
  const filteredGalaxyNodes = useMemo(() => {
    if (!activeCategory) return allGalaxyNodes;
    return allGalaxyNodes.filter(n => n.color.core === activeCategory);
  }, [allGalaxyNodes, activeCategory]);

  // Filter edges to only those connecting visible nodes
  const visibleNodeIds = useMemo(() => new Set(filteredGalaxyNodes.map(n => n.id)), [filteredGalaxyNodes]);
  const filteredEdges = useMemo(() => {
    if (!data) return [];
    return data.edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [data, visibleNodeIds]);

  // Build category legend entries from node data
  const categoryEntries: CategoryLegendEntry[] = useMemo(() => {
    const map = new Map<string, { glow: string; label: string; count: number }>();
    allGalaxyNodes.forEach(n => {
      const key = n.color.core;
      if (!map.has(key)) {
        map.set(key, { glow: n.color.glow, label: n.color.label, count: 0 });
      }
      map.get(key)!.count++;
    });
    return Array.from(map.entries()).map(([core, v]) => ({ core, ...v }));
  }, [allGalaxyNodes]);

  // Stats
  const totalConnections = useMemo(() => {
    if (!data) return 0;
    const seen = new Set<string>();
    data.edges.forEach(e => {
      const key = [e.source, e.target].sort().join('--');
      seen.add(key);
    });
    return seen.size;
  }, [data]);

  const handleNodeClick = useCallback((nodeId: string | null) => {
    if (!nodeId) { setSelectedNode(null); return; }
    const node = data?.nodes.find(n => n.id === nodeId) || null;
    setSelectedNode(prev => prev?.id === nodeId ? null : node);
    if (showTip) setShowTip(false);
  }, [data, showTip]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
          <p className="text-white/30 text-sm">星图加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <p className="text-red-400 text-sm">加载失败: {error}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden z-50" style={{ background: '#000000', cursor: 'none' }}>
      <SpotlightCursor />

      {/* 3D Galaxy Canvas */}
      <GalaxyCanvas
        nodes={filteredGalaxyNodes}
        edges={filteredEdges}
        selectedNodeId={selectedNode?.id ?? null}
        hoveredNodeId={hoveredNodeId}
        onNodeClick={handleNodeClick}
        onNodeHover={setHoveredNodeId}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 px-5 pt-5 pb-3 flex items-start justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(100,160,255,0.1)', border: '1px solid rgba(100,160,255,0.25)', boxShadow: '0 0 12px rgba(100,160,255,0.2)' }}>
            <Sparkles size={18} style={{ color: '#64a8ff' }} />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-semibold" style={{ color: 'rgba(220,235,255,0.95)', textShadow: '0 0 20px rgba(100,160,255,0.4)' }}>
              知识星系
            </h1>
            <p className="text-xs text-white/30">个人知识库 · 图谱可视化</p>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6 text-right">
          <div>
            <div className="text-lg font-bold" style={{ color: '#64b8ff', textShadow: '0 0 10px rgba(100,184,255,0.5)' }}>
              {data?.nodes.length || 0}
            </div>
            <div className="text-xs text-white/30">知识节点</div>
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: '#c084fc', textShadow: '0 0 10px rgba(192,132,252,0.5)' }}>
              {totalConnections}
            </div>
            <div className="text-xs text-white/30">知识连接</div>
          </div>
        </div>
      </header>

      {/* Category Legend */}
      {categoryEntries.length > 0 && (
        <CategoryLegend
          entries={categoryEntries}
          activeEntry={activeCategory}
          onFilter={setActiveCategory}
        />
      )}

      {/* Node Detail Panel */}
      {selectedNode && (
        <NoteDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Interaction Tip */}
      {showTip && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none"
          style={{ animation: 'fade-in-up 0.6s ease-out 1s both' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs text-white/45"
            style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
            <Info size={12} className="text-white/30" />
            拖拽旋转视角 · 滚轮缩放 · 点击星星查看详情
          </div>
        </div>
      )}

      {/* Zoom/Reset buttons */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
        <button title="放大" className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}
          onClick={() => window.dispatchEvent(new CustomEvent('galaxy-zoom', { detail: 0.15 }))}>
          <ZoomIn size={13} />
        </button>
        <button title="缩小" className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}
          onClick={() => window.dispatchEvent(new CustomEvent('galaxy-zoom', { detail: -0.15 }))}>
          <ZoomOut size={13} />
        </button>
        <button title="重置视角" className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}
          onClick={() => window.dispatchEvent(new CustomEvent('galaxy-reset'))}>
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
}
