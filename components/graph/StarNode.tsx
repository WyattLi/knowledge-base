"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface StarNodeProps {
  position: [number, number, number];
  size: number;
  color: string;
  isHovered: boolean;
  isDimmed: boolean;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onClick: () => void;
}

export function StarNode({ position, size, color, isHovered, isDimmed, onPointerEnter, onPointerLeave, onClick }: StarNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetScale = useRef(1);

  useFrame(() => {
    if (!groupRef.current) return;
    const current = groupRef.current.scale.x;
    const target = isHovered ? 1.5 : 1;
    targetScale.current += (target - targetScale.current) * 0.15;
    groupRef.current.scale.setScalar(targetScale.current);
  });

  const coreMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.8,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: isDimmed ? 0.15 : 1,
  }), [color, isDimmed]);

  const haloMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: isDimmed ? 0.03 : 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [color, isDimmed]);

  return (
    <group ref={groupRef} position={position}>
      <mesh
        onClick={onClick}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        material={coreMat}
      >
        <sphereGeometry args={[size, 16, 16]} />
      </mesh>
      <mesh material={haloMat}>
        <sphereGeometry args={[size * 2.5, 16, 16]} />
      </mesh>
    </group>
  );
}
