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
  const { enable3d, quality, theme } = usePerformance();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [allowViewportCanvas, setAllowViewportCanvas] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setAllowViewportCanvas(window.innerWidth > 960 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

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
      {enable3d && allowCanvas && allowViewportCanvas && active ? <DynamicBackgroundScene quality={quality} theme={theme} /> : null}
      <div className="scene-poster" />
      <div className="scene-vignette" />
    </div>
  );
}
