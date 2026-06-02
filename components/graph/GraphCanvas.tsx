"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useGraphData } from "./useGraphData";
import { useForceLayout } from "./useForceLayout";
import { StarNode } from "./StarNode";
import { BeamConnection } from "./BeamConnection";
import { GraphControls } from "./GraphControls";
import { NotePreviewCard } from "./NotePreviewCard";
import type { GraphNode } from "./types";

export default function GraphCanvas() {
  const { data, loading } = useGraphData();
  const { nodePositions, edgeWeights, ready } = useForceLayout(data);
  const [canvasKey, setCanvasKey] = useState(0);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [flyTarget, setFlyTarget] = useState<THREE.Vector3 | null>(null);
  const [isFlying, setIsFlying] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const connectedIds = useMemo(() => {
    if (!hoveredId || !data) return new Set<string>();
    const ids = new Set<string>([hoveredId]);
    for (const e of data.edges) {
      if (e.source === hoveredId) ids.add(e.target);
      if (e.target === hoveredId) ids.add(e.source);
    }
    return ids;
  }, [hoveredId, data]);

  const handleClick = useCallback((node: GraphNode) => {
    const pos = nodePositions.get(node.id);
    if (!pos) return;
    setSelectedNode(node);
    setFlyTarget(new THREE.Vector3(pos[0], pos[1], pos[2]));
    setIsFlying(true);
  }, [nodePositions]);

  const handleFlyComplete = useCallback(() => {
    if (!selectedNode || !canvasRef.current) return;
    const pos = nodePositions.get(selectedNode.id);
    if (!pos) return;
    // Project 3D position to screen
    const canvas = canvasRef.current;
    // We'll use a simple approach: find the canvas and place card at center-offset
    const rect = canvas.getBoundingClientRect();
    setPreviewPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 3 });
    setIsFlying(false);
  }, [selectedNode, nodePositions]);

  const handleClosePreview = useCallback(() => {
    setSelectedNode(null);
    setFlyTarget(null);
    if (controlsRef.current) {
      controlsRef.current.autoRotate = true;
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted text-lg">星图加载中...</div>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-text-muted text-lg">星空中还没有星星</p>
        <p className="text-text-muted text-sm">创建第一篇笔记后，它会出现在这里</p>
        <a href="/notes/new" className="text-nebula-purple text-sm hover:text-nebula-cyan transition-colors">
          创建笔记 &rarr;
        </a>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <Canvas
        key={canvasKey}
        ref={canvasRef}
        camera={{ position: [0, 3, 18], fov: 60, near: 0.1, far: 120 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          preserveDrawingBuffer: true,
        }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            setCanvasKey(k => k + 1);
          });
        }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={40} depth={30} count={600} factor={3} saturation={0.1} fade speed={0} />

        <GraphControls
          flyTarget={flyTarget}
          onFlyComplete={handleFlyComplete}
          controlsRef={controlsRef}
        />

        {ready && data.nodes.map(node => {
          const pos = nodePositions.get(node.id);
          if (!pos) return null;
          const color = node.tags[0]?.color || "#f0edf5";
          const size = Math.min(0.3 + node.citationCount * 0.15, 1.2);
          return (
            <StarNode
              key={node.id}
              position={pos}
              size={size}
              color={color}
              isHovered={hoveredId === node.id}
              isDimmed={hoveredId !== null && !connectedIds.has(node.id)}
              onPointerEnter={() => setHoveredId(node.id)}
              onPointerLeave={() => setHoveredId(null)}
              onClick={() => handleClick(node)}
            />
          );
        })}

        {ready && data.edges.map(edge => {
          const s = nodePositions.get(edge.source);
          const t = nodePositions.get(edge.target);
          if (!s || !t) return null;
          const key = [edge.source, edge.target].sort().join("::");
          const weight = edgeWeights.get(key) || 1;
          return (
            <BeamConnection
              key={edge.id}
              start={s}
              end={t}
              weight={weight}
              isHighlighted={hoveredId !== null && connectedIds.has(edge.source) && connectedIds.has(edge.target)}
              isDimmed={hoveredId !== null && !(connectedIds.has(edge.source) && connectedIds.has(edge.target))}
            />
          );
        })}
      </Canvas>

      {selectedNode && !isFlying && (
        <NotePreviewCard
          node={selectedNode}
          screenPos={previewPos}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}
