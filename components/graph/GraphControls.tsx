"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface GraphControlsProps {
  flyTarget: THREE.Vector3 | null;
  onFlyComplete: () => void;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}

export function GraphControls({ flyTarget, onFlyComplete, controlsRef }: GraphControlsProps) {
  const { camera } = useThree();
  const isFlying = useRef(false);

  useFrame(() => {
    if (flyTarget && controlsRef.current) {
      isFlying.current = true;
      controlsRef.current.autoRotate = false;
      const offset = new THREE.Vector3(3, 2, 4);
      const targetPos = flyTarget.clone().add(offset);
      camera.position.lerp(targetPos, 0.06);
      controlsRef.current.target.lerp(flyTarget, 0.06);
      controlsRef.current.update();

      if (camera.position.distanceTo(targetPos) < 0.5) {
        isFlying.current = false;
        onFlyComplete();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={3}
      maxDistance={50}
      autoRotate
      autoRotateSpeed={0.4}
    />
  );
}
