"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { usePerformance } from "@/lib/performance";

const DynamicBackgroundScene = dynamic(
  () => import("@/components/background-scene-canvas").then((module) => module.BackgroundSceneCanvas),
  {
    ssr: false,
  },
);

export function BackgroundScene() {
  const { enable3d, quality } = usePerformance();
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setActive(true), 300);
    return () => {
      window.clearTimeout(timeout);
      setActive(false);
    };
  }, [pathname]);

  const cinematicRoutes = ["/", "/login"];
  const allowCanvas = cinematicRoutes.some((route) => (route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(`${route}/`)));

  return (
    <div className="scene-layer" aria-hidden="true">
      {enable3d && allowCanvas && active ? <DynamicBackgroundScene quality={quality} /> : null}
      <div className="scene-poster" />
      <div className="scene-vignette" />
    </div>
  );
}
