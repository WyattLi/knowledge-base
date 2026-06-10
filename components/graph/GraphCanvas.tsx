"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useGraphData } from "./useGraphData";
import { useForceLayout } from "./useForceLayout";
import { NoteDetailPanel } from "./NoteDetailPanel";
import type { GraphNode } from "./types";

const NODE_R = 3;
const HOVER_R = 5;

export default function GraphCanvas({
  categoryId,
  tagId,
}: {
  categoryId?: string;
  tagId?: string;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const { data, loading, error } = useGraphData({ categoryId, tagId });
  const { nodePositions, edgeWeights, ready } = useForceLayout(data);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef(0);

  // View transform
  const transform = useRef({ x: 0, y: 0, scale: 1 });
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0, scale: 1 });

  // Interaction state
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string } | null>(null);
  const [search, setSearch] = useState("");
  const animTarget = useRef<{ x: number; y: number; scale: number } | null>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragTrans = useRef({ x: 0, y: 0 });

  // Node dragging
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const nodeDragOffsets = useRef(new Map<string, [number, number]>());
  const nodeDragAnchor = useRef<{ mx: number; my: number; nx: number; ny: number } | null>(null);
  const nodeWasDragged = useRef(false);

  // Adjacency map
  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!data) return map;
    for (const e of data.edges) {
      if (!map.has(e.source)) map.set(e.source, new Set());
      if (!map.has(e.target)) map.set(e.target, new Set());
      map.get(e.source)!.add(e.target);
      map.get(e.target)!.add(e.source);
    }
    return map;
  }, [data]);

  const connectedIds = useMemo(() => {
    if (!hoveredId) return new Set<string>();
    return adjacency.get(hoveredId) || new Set();
  }, [hoveredId, adjacency]);

  const searchMatches = useMemo(() => {
    if (!search.trim() || !data) return new Set<string>();
    const q = search.toLowerCase();
    return new Set(data.nodes.filter(n => n.title.toLowerCase().includes(q) || n.slug.toLowerCase().includes(q)).map(n => n.id));
  }, [search, data]);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isDark = theme === "dark";
    const { x: tx, y: ty, scale } = transform.current;
    const W = canvas.width;
    const H = canvas.height;

    // Clear to transparent
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2 + tx, H / 2 + ty);
    ctx.scale(scale, scale);

    // Edges
    const allDimmed = hoveredId !== null || searchMatches.size > 0;
    data.edges.forEach(edge => {
      const s = getNodePos(edge.source);
      const t = getNodePos(edge.target);
      if (!s || !t) return;
      const isHL = allDimmed ? connectedIds.has(edge.source) && connectedIds.has(edge.target) : true;
      const isDM = allDimmed && !isHL;
      if (isDM) return; // don't draw dimmed edges
      const key = [edge.source, edge.target].sort().join("::");
      const w = edgeWeights.get(key) || 1;
      ctx.strokeStyle = isHL
        ? (isDark ? `rgba(180,160,220,${0.4 + w * 0.1})` : `rgba(100,90,140,${0.35 + w * 0.1})`)
        : (isDark ? "rgba(100,100,110,0.12)" : "rgba(180,180,190,0.25)");
      ctx.lineWidth = isHL ? 0.8 + w * 0.3 : 0.5;
      ctx.beginPath();
      ctx.moveTo(s[0], s[1]);
      ctx.lineTo(t[0], t[1]);
      ctx.stroke();
    });

    // Nodes
    const isDimmed = (id: string) => {
      if (searchMatches.size > 0) return !searchMatches.has(id);
      if (hoveredId && !connectedIds.has(id) && id !== hoveredId) return true;
      return false;
    };

    data.nodes.forEach(node => {
      const pos = getNodePos(node.id);
      if (!pos) return;
      const [nx, ny] = pos;
      const color = node.tags[0]?.color || (isDark ? "#e0dfe6" : "#475569");
      const dimmed = isDimmed(node.id);
      const isHovered = node.id === hoveredId;
      const isSelected = selectedNode?.id === node.id;
      const r = (isHovered || isSelected) ? HOVER_R : NODE_R;
      const alpha = dimmed ? 0.1 : 1;

      if (dimmed) return;

      // Selected node: large pulsing ring
      if (isSelected) {
        const ringR = r * 5 + Math.sin(Date.now() * 0.003) * 3;
        const ringGrad = ctx.createRadialGradient(nx, ny, ringR * 0.8, nx, ny, ringR);
        ringGrad.addColorStop(0, "transparent");
        ringGrad.addColorStop(0.5, color + "30");
        ringGrad.addColorStop(1, "transparent");
        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(nx, ny, ringR, 0, Math.PI * 2);
        ctx.fill();
      }

      const glowR = isHovered || isSelected ? r * 4.5 : r * 3.5;

      // Outer glow — large, very transparent
      const outerGlow = ctx.createRadialGradient(nx, ny, 0, nx, ny, glowR);
      outerGlow.addColorStop(0, color + "22");
      outerGlow.addColorStop(0.3, color + "10");
      outerGlow.addColorStop(1, "transparent");
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(nx, ny, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Inner glow — denser
      const innerGlow = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 2.2);
      innerGlow.addColorStop(0, color + "55");
      innerGlow.addColorStop(1, "transparent");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = innerGlow;
      ctx.beginPath();
      ctx.arc(nx, ny, r * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fill();

      // Highlight dot
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(nx, ny, r * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Show label when zoomed in
      if (transform.current.scale > 0.3) {
        const fontSize = Math.max(7, 10 / transform.current.scale);
        ctx.font = `${fontSize}px system-ui, sans-serif`;
        const labelAlpha = Math.min(1, (transform.current.scale - 0.3) * 1.8);
        ctx.fillStyle = isDark
          ? `rgba(230,225,235,${labelAlpha})`
          : `rgba(30,41,59,${labelAlpha})`;
        ctx.textAlign = "center";
        ctx.fillText(node.title, nx, ny + r + 8 + fontSize * 0.6);
      }

      ctx.globalAlpha = 1;
    });

    ctx.restore();
  }, [data, nodePositions, edgeWeights, hoveredId, selectedNode, connectedIds, searchMatches, theme]);

  // Render loop with camera animation
  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      // Smooth camera animation
      if (animTarget.current) {
        const t = animTarget.current;
        const dt = 0.08;
        transform.current.x += (t.x - transform.current.x) * dt;
        transform.current.y += (t.y - transform.current.y) * dt;
        transform.current.scale += (t.scale - transform.current.scale) * dt;
        if (Math.abs(t.x - transform.current.x) < 1 && Math.abs(t.y - transform.current.y) < 1) {
          transform.current = { ...t };
          animTarget.current = null;
        }
        setViewOffset({ x: transform.current.x, y: transform.current.y, scale: transform.current.scale });
      }
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [draw, selectedNode, nodePositions]);

  // Resize canvas + auto-fit on first data
  const hasFit = useRef(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const fitToSize = () => {
      if (!canvasRef.current) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      canvasRef.current.width = w;
      canvasRef.current.height = h;

      // Auto-fit once after both data is ready and container has size
      if (ready && data && data.nodes.length > 0 && !hasFit.current) {
        const positions = Array.from(nodePositions.values());
        const xs = positions.map(p => p[0]);
        const ys = positions.map(p => p[1]);
        const gw = Math.max(Math.max(...xs) - Math.min(...xs), 1);
        const gh = Math.max(Math.max(...ys) - Math.min(...ys), 1);
        const scale = Math.min((w * 0.7) / gw, (h * 0.7) / gh, 2);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        transform.current = { x: -cx * scale, y: -cy * scale, scale };
        setViewOffset({ x: transform.current.x, y: transform.current.y, scale });
        hasFit.current = true;
      }
    };

    fitToSize();
    const ro = new ResizeObserver(fitToSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready, data, nodePositions]);

  // Pan & Zoom handlers
  const getCanvasPos = (e: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const screenToWorld = (sx: number, sy: number) => {
    const { x: tx, y: ty, scale } = transform.current;
    const W = canvasRef.current?.width || 1;
    const H = canvasRef.current?.height || 1;
    return { x: (sx - W / 2 - tx) / scale, y: (sy - H / 2 - ty) / scale };
  };

  /** Get current position of a node (dragged override or force layout) */
  const getNodePos = (id: string): [number, number] | undefined => {
    const pos3d = nodePositions.get(id);
    return nodeDragOffsets.current.get(id) || (pos3d ? [pos3d[0], pos3d[1]] : undefined);
  };

  const findNode = (wx: number, wy: number): GraphNode | null => {
    if (!data) return null;
    for (let i = data.nodes.length - 1; i >= 0; i--) {
      const n = data.nodes[i];
      const pos = getNodePos(n.id);
      if (!pos) continue;
      const dx = wx - pos[0];
      const dy = wy - pos[1];
      if (dx * dx + dy * dy < HOVER_R * HOVER_R) return n;
    }
    return null;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasPos(e);
    const world = screenToWorld(x, y);
    const node = findNode(world.x, world.y);

    if (node) {
      // Start node drag
      setDraggedNodeId(node.id);
      const pos = getNodePos(node.id) || [world.x, world.y];
      nodeDragAnchor.current = { mx: world.x, my: world.y, nx: pos[0], ny: pos[1] };
      nodeWasDragged.current = false;
      return;
    }

    // Start canvas pan
    dragStart.current = { x, y };
    dragTrans.current = { x: transform.current.x, y: transform.current.y };
    dragging.current = true;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasPos(e);

    if (draggedNodeId && nodeDragAnchor.current) {
      const world = screenToWorld(x, y);
      const { mx, my, nx, ny } = nodeDragAnchor.current;
      nodeDragOffsets.current.set(draggedNodeId, [nx + (world.x - mx), ny + (world.y - my)]);
      nodeWasDragged.current = true;
      return;
    }

    if (dragging.current) {
      const dx = x - dragStart.current.x;
      const dy = y - dragStart.current.y;
      transform.current.x = dragTrans.current.x + dx;
      transform.current.y = dragTrans.current.y + dy;
      setViewOffset({ x: transform.current.x, y: transform.current.y, scale: transform.current.scale });
      return;
    }
    // Hover detection
    const world = screenToWorld(x, y);
    const node = findNode(world.x, world.y);
    if (node) {
      setHoveredId(node.id);
      setTooltip({ x: e.clientX, y: e.clientY - 20, title: node.title });
    } else {
      setHoveredId(null);
      setTooltip(null);
    }
  };

  const onMouseUp = () => {
    dragging.current = false;
    setDraggedNodeId(null);
    nodeDragAnchor.current = null;
  };

  const onClick = (e: React.MouseEvent) => {
    if (dragging.current || nodeWasDragged.current) { nodeWasDragged.current = false; return; }
    const { x, y } = getCanvasPos(e);
    const world = screenToWorld(x, y);
    const node = findNode(world.x, world.y);
    if (node) {
      setSelectedNode(node);
      // Animate node to center of visible area (left of the right panel)
      const w = canvasRef.current?.width || 1;
      const h = canvasRef.current?.height || 1;
      const panelW = Math.min(840, w * 0.6);
      const visibleW = w - panelW;
      const targetScale = transform.current.scale;
      // screenX = W/2 + tx + wx*scale  =>  tx = screenX - W/2 - wx*scale
      const tx = visibleW * 0.4 - w / 2 - world.x * targetScale;
      const ty = h * 0.5 - h / 2 - world.y * targetScale;
      animTarget.current = { x: tx, y: ty, scale: targetScale };

    } else {
      setSelectedNode(null);
      animTarget.current = null;
    }
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const { x, y } = getCanvasPos(e);
    const world = screenToWorld(x, y);
    const node = findNode(world.x, world.y);
    if (node) router.push(`/notes/${node.slug}`);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(3, Math.max(0.1, transform.current.scale * delta));
    transform.current.scale = newScale;
    setViewOffset({ x: transform.current.x, y: transform.current.y, scale: newScale });
  };

  const resetView = () => {
    transform.current = { x: 0, y: 0, scale: 1 };
    setViewOffset({ x: 0, y: 0, scale: 1 });
    nodeDragOffsets.current.clear();
    setDraggedNodeId(null);
    nodeDragAnchor.current = null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted text-lg">星图加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-red-400 text-sm">加载失败: {error}</p>
        <button onClick={() => window.location.reload()} className="text-nebula-purple text-sm hover:underline">重试</button>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-text-muted text-lg">星空中还没有星星</p>
        <p className="text-text-muted text-sm">创建笔记并建立链接后，它们会出现在这里</p>
        <a href="/notes/new" className="text-nebula-purple text-sm hover:text-nebula-cyan transition-colors">创建笔记 &rarr;</a>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full relative"
      style={{
        background: theme === "dark"
          ? `
          radial-gradient(ellipse 60% 50% at 50% 40%, rgba(139,92,246,0.06) 0%, transparent 70%),
          radial-gradient(ellipse 40% 40% at 25% 60%, rgba(34,211,238,0.04) 0%, transparent 65%),
          radial-gradient(ellipse 50% 35% at 75% 30%, rgba(99,102,241,0.04) 0%, transparent 60%),
          #080414
        `
          : `
          radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,0,0,0.02) 0%, transparent 70%),
          radial-gradient(ellipse 40% 40% at 25% 60%, rgba(0,0,0,0.015) 0%, transparent 65%),
          #f8f7f4
        `,
      }}
    >
      {/* Search + Filter */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索节点..."
          className="w-40 glass rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        {search && <span className="text-xs text-text-muted">{searchMatches.size} 个匹配</span>}
        {(categoryId || tagId) && (
          <a
            href="/explore"
            className="glass rounded-full px-2.5 py-1 text-xs text-nebula-cyan/80 hover:text-nebula-cyan transition-colors"
          >
            清除筛选 &times;
          </a>
        )}
      </div>

      {/* Reset */}
      <button
        onClick={resetView}
        className="absolute top-4 right-4 z-10 glass rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        重置视角
      </button>

      {/* Stats */}
      <div className="absolute bottom-4 left-4 z-10 text-[10px] text-[var(--text-muted)]/40">
        {data.nodes.length} 节点 · {data.edges.length} 连线
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onWheel={onWheel}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-20 pointer-events-none bg-[var(--bg-secondary)]/90 border border-[var(--border-medium)] rounded px-2 py-1 text-xs text-text-primary shadow-sm"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
        >
          {tooltip.title}
        </div>
      )}

      {/* Side panel */}
      {selectedNode && (
        <NoteDetailPanel
          node={selectedNode}
          onClose={() => { setSelectedNode(null); animTarget.current = null; }}
        />
      )}
    </div>
  );
}
