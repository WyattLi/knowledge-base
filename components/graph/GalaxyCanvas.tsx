// 3D 知识星系画布核心渲染引擎
// Ported from xingtu-demo — pure Canvas 2D + manual 3D projection

"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { GraphNode, GraphEdge } from './types';

interface Vec3 { x: number; y: number; z: number; }

function rotateX(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return { x: v.x, y: v.y * cos - v.z * sin, z: v.y * sin + v.z * cos };
}
function rotateY(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return { x: v.x * cos + v.z * sin, y: v.y, z: -v.x * sin + v.z * cos };
}
function project(v: Vec3, focalLen: number, cx: number, cy: number) {
  const z = v.z + focalLen;
  const scale = z > 0 ? focalLen / z : 0.001;
  return { x: cx + v.x * scale, y: cy + v.y * scale, scale };
}

// Category color system — mapped from tag colors
const DEFAULT_COLOR = { core: '#64b8ff', glow: 'rgba(100, 184, 255, 0.8)', label: '知识', tagId: '' };
function getNodeColor(node: GraphNode) {
  if (node.tags.length > 0) {
    const c = node.tags[0].color;
    return { core: c, glow: c + 'CC', label: node.tags[0].name, tagId: node.tags[0].id };
  }
  return DEFAULT_COLOR;
}

interface GalaxyNode {
  id: string; title: string; x: number; y: number; z: number;
  importance: number; tags: string[]; summary: string;
  categoryId: string | null;
  color: { core: string; glow: string; label: string; tagId: string };
  connections: string[];
}

interface GalaxyCanvasProps {
  nodes: GalaxyNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  onNodeClick: (nodeId: string | null) => void;
  onNodeHover: (nodeId: string | null) => void;
}

const GalaxyCanvas: React.FC<GalaxyCanvasProps> = ({
  nodes, edges, selectedNodeId, hoveredNodeId, onNodeClick, onNodeHover,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
  const rotXRef = useRef(0.15);
  const rotYRef = useRef(0.2);
  const targetRotXRef = useRef(0.15);
  const targetRotYRef = useRef(0.2);
  const zoomRef = useRef(1);
  const targetZoomRef = useRef(1);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const bgStarsRef = useRef<{ x: number; y: number; r: number; opacity: number; twinkle: number }[]>([]);
  const autoRotateRef = useRef(true);
  const autoRotatePauseRef = useRef(0);
  const projectedNodesRef = useRef<{ id: string; sx: number; sy: number; r: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = React.useState({ w: 0, h: 0 });

  // Init background stars — dense starfield
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 500; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.2 + 0.2,
        opacity: Math.random() * 0.5 + 0.1,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
    bgStarsRef.current = stars;
  }, []);

  // Resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setCanvasSize({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  // Blue nebula — matching reference image tones
  const drawNebula = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const nebulaData = [
      { x: w * 0.50, y: h * 0.40, r: Math.max(w * 0.35, 280), color: 'rgba(15,72,116,0.09)' },
      { x: w * 0.56, y: h * 0.28, r: Math.max(w * 0.22, 200), color: 'rgba(31,142,207,0.07)' },
      { x: w * 0.38, y: h * 0.48, r: Math.max(w * 0.20, 180), color: 'rgba(14,162,214,0.06)' },
      { x: w * 0.50, y: h * 0.55, r: Math.max(w * 0.28, 240), color: 'rgba(7,100,180,0.07)' },
      { x: w * 0.30, y: h * 0.32, r: Math.max(w * 0.18, 160), color: 'rgba(34,211,238,0.05)' },
      { x: w * 0.68, y: h * 0.38, r: Math.max(w * 0.16, 150), color: 'rgba(45,160,220,0.06)' },
    ];
    nebulaData.forEach(({ x, y, r, color }) => {
      const drift = Math.sin(t * 0.0003) * 15;
      const grad = ctx.createRadialGradient(x + drift, y, 0, x + drift, y, r);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x + drift, y, r, 0, Math.PI * 2); ctx.fill();
    });
  }, []);

  // Background stars
  const drawBgStars = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    bgStarsRef.current.forEach((s) => {
      const tw = 0.5 + 0.5 * Math.sin(t * 0.001 + s.twinkle);
      const alpha = s.opacity * (0.6 + 0.4 * tw);
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${alpha})`; ctx.fill();
    });
  }, []);

  // Build connection map from edges
  const connectionMap = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of edges) {
      if (!map.has(e.source)) map.set(e.source, new Set());
      if (!map.has(e.target)) map.set(e.target, new Set());
      map.get(e.source)!.add(e.target);
      map.get(e.target)!.add(e.source);
    }
    return map;
  }, [edges]);

  // Main render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = canvasSize;
    if (w === 0 || h === 0) return;
    canvas.width = w;
    canvas.height = h;
    const cx = w / 2, cy = h / 2;

    let t = 0;
    const render = () => {
      t += 1;
      rotXRef.current += (targetRotXRef.current - rotXRef.current) * 0.05;
      rotYRef.current += (targetRotYRef.current - rotYRef.current) * 0.05;
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.08;

      const now = Date.now();
      if (autoRotateRef.current && now > autoRotatePauseRef.current) {
        targetRotYRef.current += 0.0004;
        targetRotXRef.current += 0.0001;
      }

      const fl = 900 * zoomRef.current;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#010712';
      ctx.fillRect(0, 0, w, h);

      drawNebula(ctx, w, h, t);
      drawBgStars(ctx, t);

      // Project all galaxy nodes
      interface Projected { node: GalaxyNode; rz: number; sx: number; sy: number; scale: number; opacity: number; }
      const projected: Projected[] = nodes.map((node) => {
        let v: Vec3 = { x: node.x, y: node.y, z: node.z };
        v = rotateX(v, rotXRef.current);
        v = rotateY(v, rotYRef.current);
        const p = project(v, fl, cx, cy);
        const depth = (v.z + 600) / 1200;
        const opacity = Math.max(0.15, Math.min(1, 0.3 + depth * 0.7));
        return { node, rz: v.z, sx: p.x, sy: p.y, scale: p.scale, opacity };
      });
      projected.sort((a, b) => a.rz - b.rz);
      const projMap = new Map<string, Projected>();
      projected.forEach((p) => projMap.set(p.node.id, p));

      // Draw edges
      ctx.save();
      edges.forEach((edge) => {
        const from = projMap.get(edge.source);
        const to = projMap.get(edge.target);
        if (!from || !to) return;
        if (edge.source > edge.target) return;
        const fromColors = from.node.color;
        const toColors = to.node.color;
        const avgOpacity = (from.opacity + to.opacity) / 2;
        const isHL = edge.source === selectedNodeId || edge.target === selectedNodeId ||
                     edge.source === hoveredNodeId || edge.target === hoveredNodeId;
        const lineOpacity = isHL ? avgOpacity * 0.7 : avgOpacity * 0.15;

        ctx.beginPath();
        ctx.moveTo(from.sx, from.sy);
        ctx.lineTo(to.sx, to.sy);
        const grad = ctx.createLinearGradient(from.sx, from.sy, to.sx, to.sy);
        grad.addColorStop(0, fromColors.core + Math.round(lineOpacity * 255).toString(16).padStart(2, '0'));
        grad.addColorStop(1, toColors.core + Math.round(lineOpacity * 255).toString(16).padStart(2, '0'));
        ctx.strokeStyle = grad;
        ctx.lineWidth = isHL ? 1.5 : 0.8;
        ctx.stroke();

        if (isHL) {
          ctx.beginPath();
          ctx.moveTo(from.sx, from.sy);
          ctx.lineTo(to.sx, to.sy);
          ctx.strokeStyle = fromColors.core + '25';
          ctx.lineWidth = 5;
          ctx.stroke();
        }
      });
      ctx.restore();

      // Draw nodes (stars)
      const hitTargets: { id: string; sx: number; sy: number; r: number }[] = [];
      projected.forEach(({ node, sx, sy, scale, opacity }) => {
        const colors = node.color;
        const isSelected = node.id === selectedNodeId;
        const isHovered = node.id === hoveredNodeId;
        const baseR = (2 + node.importance * 1.8) * Math.max(0.3, scale);
        const r = isSelected ? baseR * 1.6 : isHovered ? baseR * 1.3 : baseR;
        const effectiveOpacity = selectedNodeId && !isSelected && !isHovered ? opacity * 0.3 : opacity;

        if (isSelected || isHovered) {
          const outerGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 5);
          outerGlow.addColorStop(0, colors.core + '30');
          outerGlow.addColorStop(1, 'transparent');
          ctx.beginPath(); ctx.arc(sx, sy, r * 5, 0, Math.PI * 2);
          ctx.fillStyle = outerGlow; ctx.fill();
        }

        const glowR = r * 3.5;
        const glowGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        glowGrad.addColorStop(0, colors.core + Math.round(effectiveOpacity * 140).toString(16).padStart(2, '0'));
        glowGrad.addColorStop(0.3, colors.core + Math.round(effectiveOpacity * 60).toString(16).padStart(2, '0'));
        glowGrad.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad; ctx.fill();

        const coreGrad = ctx.createRadialGradient(sx - r * 0.25, sy - r * 0.25, 0, sx, sy, r);
        coreGrad.addColorStop(0, `rgba(255,255,255,${effectiveOpacity})`);
        coreGrad.addColorStop(0.3, colors.core + Math.round(effectiveOpacity * 230).toString(16).padStart(2, '0'));
        coreGrad.addColorStop(1, colors.core + Math.round(effectiveOpacity * 100).toString(16).padStart(2, '0'));
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad; ctx.fill();

        // Cross rays (importance >= 4 or selected)
        if (node.importance >= 4 || isSelected) {
          const rayLen = r * (isSelected ? 8 : 5);
          const rayOpacity = effectiveOpacity * (isSelected ? 0.7 : 0.4);
          ctx.save(); ctx.globalAlpha = rayOpacity;
          [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]].forEach(([dx, dy], i) => {
            if (i >= (isSelected ? 8 : 4)) return;
            const rayGrad = ctx.createLinearGradient(sx, sy, sx + dx * rayLen, sy + dy * rayLen);
            rayGrad.addColorStop(0, colors.core);
            rayGrad.addColorStop(1, 'transparent');
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + dx * rayLen, sy + dy * rayLen);
            ctx.strokeStyle = rayGrad;
            ctx.lineWidth = isSelected ? 1.5 : 0.8;
            ctx.stroke();
          });
          ctx.restore();
        }

        const showLabel = isSelected || isHovered || (node.importance >= 2 && effectiveOpacity > 0.5);
        if (showLabel) {
          const labelY = sy + r + 14;
          ctx.font = `${Math.round(10 + scale * 2)}px OPPOSans4, PingFang SC, sans-serif`;
          ctx.textAlign = 'center';
          ctx.shadowColor = colors.core;
          ctx.shadowBlur = isSelected ? 12 : 6;
          ctx.fillStyle = isSelected ? colors.core : `rgba(255,255,255,${Math.min(1, effectiveOpacity * 1.2)})`;
          ctx.fillText(node.title, sx, labelY);
          ctx.shadowBlur = 0;
        }

        hitTargets.push({ id: node.id, sx, sy, r: Math.max(r, 18) });
      });
      projectedNodesRef.current = hitTargets;
      animFrameRef.current = requestAnimationFrame(render);
    };
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [nodes, edges, selectedNodeId, hoveredNodeId, canvasSize, drawNebula, drawBgStars]);

  // Listen for zoom/reset events
  useEffect(() => {
    const handleZoom = (e: Event) => {
      const delta = (e as CustomEvent<number>).detail;
      targetZoomRef.current = Math.min(3, Math.max(0.4, targetZoomRef.current + delta));
    };
    const handleReset = () => {
      targetRotXRef.current = 0.15;
      targetRotYRef.current = 0.2;
      targetZoomRef.current = 1;
    };
    window.addEventListener('galaxy-zoom', handleZoom);
    window.addEventListener('galaxy-reset', handleReset);
    return () => {
      window.removeEventListener('galaxy-zoom', handleZoom);
      window.removeEventListener('galaxy-reset', handleReset);
    };
  }, []);

  // Convert viewport coords to canvas-local (canvas is not full-viewport)
  const toLocal = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    autoRotateRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      targetRotYRef.current += dx * 0.006;
      targetRotXRef.current += dy * 0.006;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const local = toLocal(e.clientX, e.clientY);
      const hits = projectedNodesRef.current;
      let hovered: string | null = null;
      for (const h of hits) {
        if (Math.hypot(local.x - h.sx, local.y - h.sy) < h.r + 6) { hovered = h.id; break; }
      }
      onNodeHover(hovered);
    }
  }, [onNodeHover, toLocal]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    autoRotatePauseRef.current = Date.now() + 3000;
    autoRotateRef.current = true;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const local = toLocal(e.clientX, e.clientY);
    const hits = projectedNodesRef.current;
    for (const h of hits) {
      if (Math.hypot(local.x - h.sx, local.y - h.sy) < h.r + 6) {
        onNodeClick(h.id);
        return;
      }
    }
    onNodeClick(null);
  }, [onNodeClick, toLocal]);

  // Wheel zoom on the container (canvas might not always receive events)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    targetZoomRef.current = Math.min(3, Math.max(0.4, targetZoomRef.current + delta));
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    onNodeHover(null);
  }, [onNodeHover]);

  // Touch
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      autoRotateRef.current = false;
    } else if (e.touches.length === 2) {
      lastPinchDistRef.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && touchStartRef.current) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      targetRotYRef.current += dx * 0.006;
      targetRotXRef.current += dy * 0.006;
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      targetZoomRef.current = Math.min(3, Math.max(0.4, targetZoomRef.current * (dist / lastPinchDistRef.current!)));
      lastPinchDistRef.current = dist;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    lastPinchDistRef.current = null;
    autoRotatePauseRef.current = Date.now() + 3000;
    autoRotateRef.current = true;
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-black" onWheel={handleWheel}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: hoveredNodeId ? 'pointer' : 'default', touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};

// Helper to build galaxy nodes from graph data + force layout positions
export function buildGalaxyNodes(
  graphNodes: GraphNode[],
  positions: Map<string, [number, number, number]>,
  edges: GraphEdge[],
): GalaxyNode[] {
  // Build connection lookup
  const connMap = new Map<string, string[]>();
  for (const e of edges) {
    if (!connMap.has(e.source)) connMap.set(e.source, []);
    if (!connMap.has(e.target)) connMap.set(e.target, []);
    connMap.get(e.source)!.push(e.target);
    connMap.get(e.target)!.push(e.source);
  }

  return graphNodes.map(n => {
    const pos = positions.get(n.id) || [0, 0, 0];
    return {
      id: n.id,
      title: n.title,
      x: pos[0],
      y: pos[1],
      z: pos[2],
      importance: Math.min(5, Math.max(2, Math.ceil(n.citationCount / 2) + 1)),
      tags: n.tags.map(t => t.name),
      summary: n.summary || '',
      categoryId: n.categoryId,
      color: getNodeColor(n),
      connections: connMap.get(n.id) || [],
    };
  });
}

export default GalaxyCanvas;
