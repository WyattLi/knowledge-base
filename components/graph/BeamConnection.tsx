"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";

interface BeamConnectionProps {
  start: [number, number, number];
  end: [number, number, number];
  weight: number;
  isHighlighted: boolean;
  isDimmed: boolean;
}

export function BeamConnection({ start, end, weight, isHighlighted, isDimmed }: BeamConnectionProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const mid = useMemo(() =>
    new THREE.Vector3((start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2),
    [start, end]
  );

  const direction = useMemo(() =>
    new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]),
    [start, end]
  );

  const length = direction.length();
  const thickness = 0.03 + weight * 0.015;

  const orientation = useMemo(() => {
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return quat;
  }, [direction]);

  const opacity = isDimmed ? 0.04 : isHighlighted ? 0.7 : 0.2 + weight * 0.1;
  const color = isHighlighted ? "#8b5cf6" : "#22d3ee";

  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [color, opacity]);

  return (
    <mesh ref={meshRef} position={mid} quaternion={orientation} material={mat}>
      <cylinderGeometry args={[thickness, thickness, length, 6]} />
    </mesh>
  );
}
