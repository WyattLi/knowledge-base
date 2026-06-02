"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import CosmicBackground from "./CosmicBackground";

function DetectPath() {
  const pathname = usePathname();
  if (pathname === "/explore") return null;
  return <CosmicBackground />;
}

export default function CosmicBackgroundWrapper() {
  return (
    <Suspense fallback={null}>
      <DetectPath />
    </Suspense>
  );
}
